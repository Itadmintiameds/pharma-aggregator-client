"use client";

import React from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";

interface Props {
  tempBuyer: RawTempBuyer | null;
  onBack: () => void;
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900">{title}</h3>
        {badge && <span className="px-2.5 py-0.5 rounded-full bg-warning-50 text-warning-600 text-p4 font-body font-medium">{badge}</span>}
      </div>
      <div className="border-t border-neutral-200 mb-4" />
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-p4 font-body text-pneutral-500">{label}</p>
      <p className="text-p3 font-body font-semibold text-pneutral-900">{value || "—"}</p>
    </div>
  );
}

// Read-only recap of a buyer's already-submitted application — shown by
// "View Submitted Details" on the submitted/under_review status card.
// Unlike the wizard's ReviewForm (which needs the full BuyerFormData shape
// and edit/submit handlers), this reads directly off the raw entity the
// backend already returns, so it can render without touching the wizard at
// all — the earlier version wired this button to the wizard's own onResume,
// which incorrectly dropped a buyer with a fully submitted application back
// into the editable form.
export default function BuyerSubmittedDetailsCard({ tempBuyer, onBack }: Props) {
  const address = tempBuyer?.address;
  const contact = tempBuyer?.contact;
  const documents = tempBuyer?.documents ?? [];

  const addressLine = [address?.buildingNo, address?.street, address?.city, address?.taluka?.talukaName, address?.district?.districtName, address?.state?.stateName, address?.pinCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary-700 text-p3 font-body font-semibold mb-6">
        <ArrowLeft size={16} />
        Back to status
      </button>

      <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-1">Submitted Application Details</h2>
      <p className="text-p3 font-body text-pneutral-600 mb-6">Application ID {tempBuyer?.tempBuyerRequestId || "—"}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Organization Details">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Row label="Organization Name" value={tempBuyer?.organizationName} />
            <Row label="Buyer Type" value={tempBuyer?.buyerType?.buyerTypeName} />
            <Row label="GST Number" value={tempBuyer?.gstNumber} />
            <Row label="PAN Number" value={tempBuyer?.panNumber} />
          </div>
          <div className="mt-3">
            <Row label="Address" value={addressLine} />
          </div>
        </Card>

        <Card title="Contact Details">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Row label="Full Name" value={contact?.name} />
            <Row label="Designation" value={contact?.designation} />
            <Row label="Email" value={contact?.email} />
            <Row label="Mobile" value={contact?.mobile} />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Compliance Documents" badge={`${documents.filter((d) => isRealFileUrl(d.documentFileUrl)).length} of ${documents.length || 4} uploaded`}>
          {documents.length === 0 ? (
            <p className="text-p3 font-body text-pneutral-500">No documents on file yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-p4 font-body font-semibold text-pneutral-500 border-b border-neutral-200">
                    <th className="py-2 pr-4 font-medium">Document</th>
                    <th className="py-2 pr-4 font-medium">Number</th>
                    <th className="py-2 font-medium">File</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr key={doc.tempBuyerDocumentId ?? i} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 text-p3 font-body font-semibold text-pneutral-900">
                          <FileText size={16} className="text-pneutral-400 shrink-0" />
                          {doc.documentType?.documentTypeName || "Document"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-p4 font-body text-pneutral-600">{doc.documentNumber || "—"}</td>
                      <td className="py-3">
                        {isRealFileUrl(doc.documentFileUrl) ? (
                          <button
                            type="button"
                            onClick={() => window.open(doc.documentFileUrl, "_blank", "noopener,noreferrer")}
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
          )}
        </Card>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
        <button
          onClick={onBack}
          className="h-11 px-5 rounded-xl border-2 border-secondary-600 text-secondary-600 font-body font-semibold text-p3 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Status
        </button>
      </div>
    </div>
  );
}
