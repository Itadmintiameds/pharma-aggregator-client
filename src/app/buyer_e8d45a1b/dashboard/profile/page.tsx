"use client";

import React from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  FileText,
  BadgeCheck,
  ExternalLink,
  Hash,
  Calendar,
} from "lucide-react";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function VerifiedPill({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-label-l2 font-heading font-medium text-success-600">
      <BadgeCheck size={14} /> Verified
    </span>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-l2 font-heading text-pneutral-500">{label}</p>
      <p className="text-p3 font-body text-pneutral-900 mt-0.5">{value || "—"}</p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  iconBg = "bg-secondary-100",
  iconColor = "text-primary-900",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base-white rounded-md overflow-hidden border border-pneutral-200">
      <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h2 className="text-h6 font-heading font-medium text-pneutral-900">{title}</h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Read-only buyer profile view built from the TempBuyer registration record —
// there's no separate "approved Buyer profile" endpoint on the backend yet
// (see useBuyerOnboardingStatus.ts's comment), so this is the same data
// source the onboarding gate already uses, just rendered for viewing rather
// than editing. Unlike SellerProfile.tsx, this has no edit/update flow —
// buyer profile editing infrastructure (OTP-gated field updates, doc
// re-upload) doesn't exist yet on this side.
export default function BuyerProfilePage() {
  const { status, tempBuyer } = useBuyerOnboardingStatus();
  const currentUser = buyerAuthService.getCurrentUser();

  if (status === "checking") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (!tempBuyer) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <p className="text-p3 font-body text-pneutral-600">No profile details found yet.</p>
      </div>
    );
  }

  const { address, contact, documents } = tempBuyer;

  return (
    <div className="bg-pneutral-50 -m-6 min-h-[calc(100vh-74px)] w-[calc(100%+3rem)] p-6 space-y-6">
      {/* Header */}
      <div className="bg-base-white rounded-md border border-pneutral-200 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-secondary-100 text-primary-900 flex items-center justify-center flex-shrink-0">
          <Building2 size={28} />
        </div>
        <div className="min-w-0">
          <h2 className="text-h4 font-heading font-bold text-pneutral-900 truncate">
            {tempBuyer.organizationName || "Buyer Account"}
          </h2>
          <p className="text-p3 font-body text-pneutral-600">
            {tempBuyer.buyerType?.buyerTypeName || "Buyer"} · {currentUser?.email}
          </p>
        </div>
      </div>

      {/* Organization details */}
      <SectionCard icon={<Hash size={16} />} title="Organization Details" iconBg="bg-secondary-100" iconColor="text-primary-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Organization Name" value={tempBuyer.organizationName} />
          <Field label="Buyer Type" value={tempBuyer.buyerType?.buyerTypeName} />
          <Field label="GST Number" value={tempBuyer.gstNumber} />
          <Field label="PAN Number" value={tempBuyer.panNumber} />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard icon={<MapPin size={16} />} title="Address" iconBg="bg-info-50" iconColor="text-info-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Building / Street" value={[address?.buildingNo, address?.street].filter(Boolean).join(", ")} />
          <Field label="Landmark" value={address?.landmark} />
          <Field label="City" value={address?.city} />
          <Field label="Taluka" value={address?.taluka?.talukaName} />
          <Field label="District" value={address?.district?.districtName} />
          <Field label="State" value={address?.state?.stateName} />
          <Field label="Pin Code" value={address?.pinCode} />
        </div>
      </SectionCard>

      {/* Contact person */}
      <SectionCard icon={<Phone size={16} />} title="Contact Person" iconBg="bg-success-50" iconColor="text-success-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" value={contact?.name} />
          <Field label="Designation" value={contact?.designation} />
          <Field
            label="Email"
            value={
              <span className="flex items-center gap-2">
                <Mail size={14} className="text-pneutral-500" />
                {contact?.email}
                <VerifiedPill verified={contact?.emailVerified} />
              </span>
            }
          />
          <Field
            label="Mobile"
            value={
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-pneutral-500" />
                {contact?.mobile}
                <VerifiedPill verified={contact?.phoneVerified} />
              </span>
            }
          />
        </div>
      </SectionCard>

      {/* Documents */}
      <SectionCard icon={<FileText size={16} />} title="Documents & Licenses" iconBg="bg-danger-50" iconColor="text-warning-500">
        {!documents || documents.length === 0 ? (
          <p className="text-p3 font-body text-pneutral-500">No documents uploaded.</p>
        ) : (
          <div className="flex flex-col divide-y divide-pneutral-200">
            {documents.map((doc, index) => (
              <div key={doc.tempBuyerDocumentId ?? index} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-p3 font-body font-semibold text-pneutral-900 flex items-center gap-2">
                    {doc.documentType?.documentTypeName || "Document"}
                  </p>
                  <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5">
                    No. {doc.documentNumber || "—"}
                    {doc.licenseIssuingAuthority ? ` · ${doc.licenseIssuingAuthority}` : ""}
                  </p>
                  {(doc.licenseIssueDate || doc.licenseExpiryDate) && (
                    <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(doc.licenseIssueDate)} – {formatDate(doc.licenseExpiryDate)}
                    </p>
                  )}
                </div>
                {doc.documentFileUrl && (
                  <a
                    href={doc.documentFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-label-l2 font-heading font-medium text-primary-700 hover:underline flex-shrink-0"
                  >
                    View <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
