"use client";

import React from "react";
import Image from "next/image";
import { FileText, ShieldCheck, Clock, Lock } from "lucide-react";
import { GoCheckCircleFill } from "react-icons/go";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import { requiredBuyerDocumentCodes } from "@/src/schema/buyer/buyerRegSchema";
import { BuyerFormData } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  buyerTypeName?: string;
  // Resolved by BuyerRegister.tsx from GET /buyer-types +
  // GET /document-types — not a hardcoded buyer-type-name -> label map.
  mandatoryDocumentTypeId?: number;
  mandatoryDocumentTypeName?: string;
  onEdit: (section: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  prevStep: () => void;
  confirmChecked: boolean;
  onConfirmChange: (checked: boolean) => void;
}

interface DocRow {
  label: string;
  value?: string;
  uploaded: boolean;
  optional: boolean;
  file?: File | null;
  fileUrl?: string;
}

// Read-only recap of steps 1-3, with per-section Edit links. Structurally a
// fork of src/app/seller_7a3b9f2c/components/ReviewForm.tsx's local
// Card/Row helpers (that file defines them inline rather than in a shared
// Section.tsx — there is no role-agnostic review-section component to
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
  confirmChecked,
  onConfirmChange,
}: Props) {
  const mandatoryCode = requiredBuyerDocumentCodes(mandatoryDocumentTypeId)[0];
  const mandatoryDoc = mandatoryCode ? formData.documents?.[mandatoryCode] : undefined;

  const docs: DocRow[] = [
    {
      label: mandatoryDocumentTypeName || "Drug License",
      value: mandatoryDoc?.number,
      uploaded: !!mandatoryDoc?.file || isRealFileUrl(mandatoryDoc?.fileUrl),
      optional: false,
      file: mandatoryDoc?.file,
      fileUrl: mandatoryDoc?.fileUrl,
    },
    {
      label: "GST Certificate",
      value: formData.gstNumber,
      uploaded: !!formData.gstFile || isRealFileUrl(formData.gstFileUrl),
      optional: true,
      file: formData.gstFile,
      fileUrl: formData.gstFileUrl,
    },
    {
      label: "PAN Card",
      value: formData.panNumber,
      uploaded: !!formData.panFile || isRealFileUrl(formData.panFileUrl),
      optional: true,
      file: formData.panFile,
      fileUrl: formData.panFileUrl,
    },
    {
      label: "Organization Logo",
      value: "-",
      uploaded: !!formData.orgLogoFile || isRealFileUrl(formData.orgLogoUrl),
      optional: true,
      file: formData.orgLogoFile,
      fileUrl: formData.orgLogoUrl,
    },
  ];
  const uploadedCount = docs.filter((d) => d.uploaded).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-700 text-white shrink-0">
          <ShieldCheck size={16} />
        </span>
        <div>
          <h1 className="text-h4 font-heading font-medium text-pneutral-900">Review &amp; Submit Your Registration</h1>
          <p className="text-p3 font-body font-regular text-pneutral-600 mt-0.5">
            Please review all the information below. You can edit any section before submitting for verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Terms &amp; Declaration" onEdit={undefined}>
          <div className="flex items-center gap-2">
            <span className="text-p4 font-body font-semibold text-pneutral-900">Terms Accepted</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-p4 font-body font-medium ${
                confirmChecked ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-600"
              }`}
            >
              {confirmChecked ? "Yes" : "No"}
            </span>
          </div>
          <p className="text-p4 font-body font-regular text-secondary-700">
            {confirmChecked
              ? "You have accepted the terms and conditions."
              : "Confirm the declaration below to accept the terms and conditions."}
          </p>
        </Card>

        <Card title="Organization Details" onEdit={() => onEdit("org")}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Row label="Organization Name" value={formData.organizationName} />
            <Row label="PAN Number" value={formData.panNumber} />
            <Row label="Buyer Type" value={buyerTypeName} />
            <Row
              label="Address"
              value={[formData.buildingNo, formData.street, formData.city, formData.district, formData.state, formData.pinCode]
                .filter(Boolean)
                .join(", ")}
            />
            <Row label="GST Number" value={formData.gstNumber} />
          </div>
        </Card>
      </div>

      <Card title="Contact Details" onEdit={() => onEdit("contact")}>
        <div className="grid grid-cols-2 gap-y-3 gap-x-10">
          <Row label="Full Name" value={formData.contactName} />
          <Row label="Designation" value={formData.contactDesignation} />
          <RowBadge label="Email" value={formData.contactEmail} verified={formData.emailVerified} />
          <RowBadge label="Mobile" value={formData.contactMobile} verified={formData.phoneVerified} />
        </div>
      </Card>

      <Card
        title="Compliance Documents"
        onEdit={() => onEdit("license")}
        badge={`${uploadedCount} of ${docs.length} uploaded`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-p4 font-body font-semibold text-pneutral-500 border-b border-neutral-200">
                <th className="py-2 pr-4 font-medium">Document</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.label} className="border-b border-neutral-100 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 text-p3 font-body font-semibold text-pneutral-900 whitespace-nowrap">
                      <FileText size={16} className="text-pneutral-400 shrink-0" />
                      {doc.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-p4 font-body font-regular text-pneutral-600">{doc.value || "-"}</td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-p4 font-body font-medium whitespace-nowrap ${
                          doc.uploaded ? "bg-success-50 border-success-200 text-success-600" : "bg-white border-warning-300 text-warning-600"
                        }`}
                      >
                        {doc.uploaded ? <GoCheckCircleFill size={12} /> : null}
                        {doc.uploaded ? "Uploaded" : "Not Uploaded"}
                      </span>
                      {doc.optional && (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-pneutral-500 text-p4 font-body font-medium">Optional</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3">
                    {doc.uploaded && (doc.file || doc.fileUrl) ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.file) {
                            const objectUrl = URL.createObjectURL(doc.file);
                            window.open(objectUrl, "_blank");
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
                          } else if (doc.fileUrl) {
                            window.open(doc.fileUrl, "_blank");
                          }
                        }}
                        className="text-secondary-700 text-p4 font-body font-medium hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-pneutral-400 text-p4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="rounded-xl bg-success-50 border border-success-200 px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-2">
          <GoCheckCircleFill className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-p3 font-body font-semibold text-pneutral-900">You&apos;re all set!</p>
            <p className="text-p4 font-body font-regular text-pneutral-600 mt-0.5">
              Your application will be submitted for verification. We will notify you via email and SMS once reviewed.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-p3 font-body font-semibold text-pneutral-900">Typical review time</p>
            <p className="text-p4 font-body font-regular text-pneutral-600 mt-0.5">1 – 2 business days</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Lock className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-p3 font-body font-semibold text-pneutral-900">Your information is secure</p>
            <p className="text-p4 font-body font-regular text-pneutral-600 mt-0.5">Encrypted and protected</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200">
        <button
          onClick={prevStep}
          className="h-12 px-6 border-2 border-secondary-600 text-secondary-600 rounded-xl flex items-center gap-2 font-semibold shrink-0"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="w-5 h-5 rounded border-neutral-400 accent-secondary-600"
          />
          <span className="text-p3 font-body font-regular text-pneutral-900">
            I confirm that the information provided is accurate and the documents uploaded are valid.
          </span>
        </label>

        <button
          onClick={onSubmit}
          disabled={submitting || !confirmChecked}
          className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children, onEdit, badge }: { title: string; children: React.ReactNode; onEdit?: () => void; badge?: string }) {
  return (
    <div className="h-full flex flex-col border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3 gap-2">
        <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 leading-[24px] flex items-center gap-2">
          <GoCheckCircleFill className="w-4 h-4 text-success-600" />
          {title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {badge && <span className="px-2.5 py-0.5 rounded-full bg-warning-50 text-warning-600 text-p4 font-body font-medium whitespace-nowrap">{badge}</span>}
          {onEdit && (
            <button onClick={onEdit} className="text-secondary-700 text-p3 font-body font-medium flex items-center gap-1">
              <Image src="/icons/EditIcon.png" alt="Edit" width={16.87} height={16.87} />
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-neutral-200 mb-4" />
      <div className="flex-1 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-p4 font-body font-regular text-pneutral-500">{label}</p>
      <p className="text-p3 font-body font-semibold text-pneutral-900 truncate">{value || "-"}</p>
    </div>
  );
}

function RowBadge({ label, value, verified }: { label: string; value?: string; verified: boolean }) {
  return (
    <div>
      <p className="text-p4 font-body font-regular text-pneutral-500">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-p3 font-body font-semibold text-pneutral-900 truncate">{value || "-"}</p>
        {verified && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 text-success-600 text-p4 font-body font-medium shrink-0">
            <GoCheckCircleFill size={11} />
            Verified
          </span>
        )}
      </div>
    </div>
  );
}
