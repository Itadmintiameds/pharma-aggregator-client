"use client";

import React from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { GoCheckCircleFill } from "react-icons/go";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import { requiredBuyerDocumentCodes } from "@/src/schema/buyer/buyerRegSchema";
import { BuyerFormData } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  buyerTypeName?: string;
  // Resolved by BuyerRegister.tsx from GET /buyer-types +
  // GET /document-types (see DocumentsForm.tsx's identical props) — not a
  // hardcoded buyer-type-name -> label map.
  mandatoryDocumentTypeId?: number;
  mandatoryDocumentTypeName?: string;
  onEdit: (section: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  prevStep: () => void;
}

// Read-only recap of Steps 1-4, with per-section Edit links. Structurally a
// fork of src/app/seller_7a3b9f2c/components/ReviewForm.tsx's local
// Card/Row/DocRow helpers (that file defines them inline rather than in a
// shared Section.tsx — there is no role-agnostic review-section component to
// import), rebuilt here for the buyer's field set.
export default function ReviewForm({
  formData,
  buyerTypeName,
  mandatoryDocumentTypeId,
  mandatoryDocumentTypeName,
  onEdit,
  onSubmit,
  submitting,
  prevStep,
}: Props) {
  const mandatoryCode = requiredBuyerDocumentCodes(mandatoryDocumentTypeId)[0];
  const mandatoryDoc = mandatoryCode ? formData.documents?.[mandatoryCode] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Review &amp; Confirm Your Registration
        </h1>
        <p className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Please verify your details before submission.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Terms" onEdit={() => onEdit("terms")}>
          <Row label="Terms Accepted" value={formData.acceptedTerms ? "Yes" : "No"} />
        </Card>

        <Card title="Organization Details" onEdit={() => onEdit("org")}>
          <Row label="Organization Name" value={formData.organizationName} />
          <Row label="Buyer Type" value={buyerTypeName} />
          <Row label="GST Number" value={formData.gstNumber} />
          <Row label="PAN Number" value={formData.panNumber} />
          <Row label="Address" value={[formData.buildingNo, formData.street, formData.city, formData.district, formData.state, formData.pinCode].filter(Boolean).join(", ")} />
        </Card>
      </div>

      <Card title="Contact Details" onEdit={() => onEdit("contact")}>
        <div className="grid grid-cols-2 gap-y-3 gap-x-10">
          <Row label="Full Name" value={formData.contactName} />
          <Row label="Designation" value={formData.contactDesignation} />
          <Row label="Email" value={formData.contactEmail} />
          <Row label="Mobile" value={formData.contactMobile} />
        </div>
      </Card>

      <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
        <div className="space-y-4">
          {mandatoryCode && (
            <DocRow
              label={mandatoryDocumentTypeName || "Mandatory Document"}
              value={mandatoryDoc?.number}
              uploaded={!!mandatoryDoc?.file || isRealFileUrl(mandatoryDoc?.fileUrl)}
              file={mandatoryDoc?.file}
              fileUrl={mandatoryDoc?.fileUrl}
            />
          )}
          {formData.gstNumber && (
            <DocRow
              label="GST Certificate"
              value={formData.gstNumber}
              uploaded={!!formData.gstFile || isRealFileUrl(formData.gstFileUrl)}
              file={formData.gstFile}
              fileUrl={formData.gstFileUrl}
            />
          )}
          {formData.panNumber && (
            <DocRow
              label="PAN Card"
              value={formData.panNumber}
              uploaded={!!formData.panFile || isRealFileUrl(formData.panFileUrl)}
              file={formData.panFile}
              fileUrl={formData.panFileUrl}
            />
          )}
          <DocRow
            label="Organization Logo"
            value="-"
            uploaded={!!formData.orgLogoFile || isRealFileUrl(formData.orgLogoUrl)}
            file={formData.orgLogoFile}
            fileUrl={formData.orgLogoUrl}
          />
        </div>
      </Card>

      <div className="bg-success-50 border border-success-200 rounded-lg px-4 py-3 flex items-center gap-2">
        <GoCheckCircleFill className="w-5 h-5 text-success-600" />
        <span className="text-p3 font-body font-semibold text-pneutral-900">All registration steps completed.</span>
        <span className="text-p3 font-body font-regular text-pneutral-600">Your application is ready for submission.</span>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={prevStep}
          className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-pneutral-900 text-pneutral-900 font-semibold"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={20} height={20} />
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-800 text-primary-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit"}
          {!submitting && <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} />}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="h-full flex flex-col border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 leading-[24px]">{title}</h3>
        <button onClick={onEdit} className="text-primary-800 text-p3 font-body font-medium flex items-center gap-1">
          <Image src="/icons/EditIcon.png" alt="Edit" width={16.87} height={16.87} />
          Edit
        </button>
      </div>
      <div className="border-t border-neutral-200 mb-4" />
      <div className="flex-1 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center text-md">
      <span className="text-p4 font-body font-semibold text-pneutral-900">{label}</span>
      <span className="text-p4 font-body font-regular text-pneutral-900 truncate">{value || "-"}</span>
    </div>
  );
}

function DocRow({
  label,
  value,
  uploaded,
  file,
  fileUrl,
}: {
  label: string;
  value?: string;
  uploaded: boolean;
  file?: File | null;
  fileUrl?: string;
}) {
  const handleView = () => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      window.open(objectUrl, "_blank");
      // Delayed, not immediate — the new tab still needs to fetch the blob;
      // revoking right away can race that fetch and break the preview.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } else if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-[280px_1fr_auto] items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 shrink-0 text-pneutral-500" />
          <span className="text-p4 font-body font-semibold text-pneutral-900 whitespace-nowrap">{label}</span>
        </div>
        <div className="flex justify-center">
          <span className="text-p4 font-body font-regular text-pneutral-900 truncate">{value || "-"}</span>
        </div>
        <div className="flex items-center justify-end gap-3 min-w-fit">
          {uploaded ? (
            <>
              <GoCheckCircleFill className="w-5 h-5 text-success-600 shrink-0" />
              <span className="text-p3 font-body font-regular text-pneutral-900 whitespace-nowrap">Uploaded</span>
              {(file || fileUrl) && (
                <button onClick={handleView} className="text-primary-800 text-p3 font-body font-medium hover:underline whitespace-nowrap">
                  View
                </button>
              )}
            </>
          ) : (
            <span className="text-p3 font-body font-regular text-warning-500 whitespace-nowrap">Not Uploaded</span>
          )}
        </div>
      </div>
      <div className="border-b border-neutral-200 mt-3" />
    </div>
  );
}
