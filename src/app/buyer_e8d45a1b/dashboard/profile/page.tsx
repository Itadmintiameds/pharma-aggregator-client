"use client";

import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Headset,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { getBuyerProfileCompletion, useBuyerOnboardingStatus, BuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { ApprovedBuyerProfile, getApprovedBuyerProfile } from "@/src/services/buyer/buyerProfileService";
import type { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";

const WARN_DAYS = 60;

const STATUS_LABELS: Partial<Record<BuyerOnboardingStatus, { text: string; className: string }>> = {
  approved: { text: "Approved buyer", className: "bg-green-50 text-green-700 ring-green-200" },
  submitted: { text: "Under review", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  under_review: { text: "Under review", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  correction_required: { text: "Correction needed", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  draft: { text: "Registration incomplete", className: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
  rejected: { text: "Rejected", className: "bg-red-50 text-red-700 ring-red-200" },
  suspended: { text: "Suspended", className: "bg-red-50 text-red-700 ring-red-200" },
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(value?: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function initials(name?: string) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "B";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

function Verified({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <BadgeCheck size={12} /> Verified
    </span>
  );
}

/** A value with a small copy button, for the numbers people paste into forms (GST, PAN). */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (insecure context or permissions): nothing to do
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  );
}

function Field({ label, value, copyable }: { label: string; value?: React.ReactNode; copyable?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 break-words text-p3 font-body font-medium text-neutral-900">{value || "—"}</p>
        {copyable && <CopyButton text={copyable} label={label} />}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
        <h2 className="text-p2 font-heading font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ExpiryChip({ expiry }: { expiry?: string }) {
  const days = daysUntil(expiry);
  if (days === null) return null;
  if (days < 0) {
    return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">Expired {Math.abs(days)} days ago</span>;
  }
  if (days <= WARN_DAYS) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Expires in {days} days</span>;
  }
  return <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Valid</span>;
}

/** What the page shows, whichever record it came from. */
interface ProfileView {
  organizationName?: string;
  buyerTypeName?: string;
  gstNumber?: string;
  panNumber?: string;
  address: {
    buildingNo?: string;
    street?: string;
    landmark?: string;
    city?: string;
    taluka?: string;
    district?: string;
    state?: string;
    pinCode?: string;
  };
  contact: {
    name?: string;
    designation?: string;
    email?: string;
    emailVerified?: boolean;
    mobile?: string;
    phoneVerified?: boolean;
  };
  documents: {
    key: string | number;
    typeName?: string;
    number?: string;
    authority?: string;
    issueDate?: string;
    expiryDate?: string;
    fileUrl?: string;
  }[];
}

/** The original registration form - all there is until the buyer is approved. */
function viewFromRegistration(buyer: RawTempBuyer): ProfileView {
  return {
    organizationName: buyer.organizationName,
    buyerTypeName: buyer.buyerType?.buyerTypeName,
    gstNumber: buyer.gstNumber,
    panNumber: buyer.panNumber,
    address: {
      buildingNo: buyer.address?.buildingNo,
      street: buyer.address?.street,
      landmark: buyer.address?.landmark,
      city: buyer.address?.city,
      taluka: buyer.address?.taluka?.talukaName,
      district: buyer.address?.district?.districtName,
      state: buyer.address?.state?.stateName,
      pinCode: buyer.address?.pinCode,
    },
    contact: {
      name: buyer.contact?.name,
      designation: buyer.contact?.designation,
      email: buyer.contact?.email,
      emailVerified: buyer.contact?.emailVerified,
      mobile: buyer.contact?.mobile,
      phoneVerified: buyer.contact?.phoneVerified,
    },
    documents: (buyer.documents ?? []).map((doc, index) => ({
      key: doc.tempBuyerDocumentId ?? index,
      typeName: doc.documentType?.documentTypeName,
      number: doc.documentNumber,
      authority: doc.licenseIssuingAuthority,
      issueDate: doc.licenseIssueDate,
      expiryDate: doc.licenseExpiryDate,
      fileUrl: doc.documentFileUrl,
    })),
  };
}

/** The approved buyer record: what the platform really uses, and what an admin-approved change updates. */
function viewFromApproved(profile: ApprovedBuyerProfile, fallback: ProfileView): ProfileView {
  const contact = profile.contacts?.[0];
  return {
    organizationName: profile.buyerName ?? fallback.organizationName,
    buyerTypeName: profile.buyerTypeName ?? fallback.buyerTypeName,
    gstNumber: profile.gstNumber ?? fallback.gstNumber,
    panNumber: profile.panNumber ?? fallback.panNumber,
    address: {
      buildingNo: profile.address?.buildingNo,
      street: profile.address?.street,
      landmark: profile.address?.landmark,
      city: profile.address?.city,
      taluka: profile.address?.talukaName,
      district: profile.address?.districtName,
      state: profile.address?.stateName,
      pinCode: profile.address?.pinCode,
    },
    contact: {
      name: contact?.name,
      designation: contact?.designation,
      email: contact?.email ?? profile.email,
      emailVerified: contact?.isEmailVerified ?? contact?.emailVerified,
      mobile: contact?.mobile ?? profile.phone,
      phoneVerified: contact?.isPhoneVerified ?? contact?.phoneVerified,
    },
    // Documents fall back to the registration copies if the approved record has none.
    documents:
      profile.documents && profile.documents.length > 0
        ? profile.documents.map((doc, index) => ({
            key: doc.documentId ?? index,
            typeName: doc.documentTypeName,
            number: doc.documentNumber,
            authority: doc.licenseIssuingAuthority,
            issueDate: doc.licenseIssueDate,
            expiryDate: doc.licenseExpiryDate,
            fileUrl: doc.documentFileUrl,
          }))
        : fallback.documents,
  };
}

// Read-only buyer profile. Once the buyer is approved it shows the approved buyer record (the one orders, quotes and
// admin updates use); until then it shows the registration form they filled in. There is no edit flow on this side
// yet, so the page points to support for any change.
export default function BuyerProfilePage() {
  const { status, tempBuyer } = useBuyerOnboardingStatus();
  const currentUser = buyerAuthService.getCurrentUser();
  const buyerUserId = currentUser?.buyerUserId;
  // undefined: not loaded yet; null: there is no approved record (or it could not be read)
  const [approved, setApproved] = useState<ApprovedBuyerProfile | null | undefined>(undefined);

  useEffect(() => {
    if (status !== "approved" || buyerUserId == null) return;
    let cancelled = false;
    getApprovedBuyerProfile(buyerUserId)
      .then((profile) => !cancelled && setApproved(profile))
      .catch(() => !cancelled && setApproved(null));
    return () => {
      cancelled = true;
    };
  }, [status, buyerUserId]);

  const waitingForApproved = status === "approved" && approved === undefined;

  if (status === "checking" || waitingForApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
      </div>
    );
  }

  if (!tempBuyer && !approved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-p3 font-body text-neutral-600">No profile details found yet.</p>
      </div>
    );
  }

  const registrationView = tempBuyer ? viewFromRegistration(tempBuyer) : null;
  const view: ProfileView = approved
    ? viewFromApproved(approved, registrationView ?? { address: {}, contact: {}, documents: [] })
    : (registrationView as ProfileView);
  const { address, contact, documents } = view;

  const completion = getBuyerProfileCompletion(status);
  const statusChip = STATUS_LABELS[status];
  const fullAddress = [
    [address.buildingNo, address.street].filter(Boolean).join(", "),
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
  const location = [address.city, address.state].filter(Boolean).join(", ");
  const email = contact.email ?? currentUser?.email;

  return (
    <div className="space-y-6">
      {/* ================================================================ header */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary-900 via-primary-700 to-secondary-500" />
        <div className="px-6 pb-6">
          {/* Only the avatar overlaps the banner; the name sits below it, on white, where it is readable. */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-primary-100 text-h4 font-heading font-bold text-primary-900 shadow-md">
                {initials(view.organizationName)}
              </div>
              <div className="min-w-0 pt-3">
                <h1 className="truncate text-h4 font-heading font-bold text-neutral-900">
                  {view.organizationName || "Buyer account"}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {view.buyerTypeName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                      <Building2 size={12} /> {view.buyerTypeName}
                    </span>
                  )}
                  {statusChip && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusChip.className}`}>
                      {statusChip.text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {completion && (
              <div className="w-full pt-3 sm:w-64">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-600">Profile completion</span>
                  <span className="font-semibold text-neutral-900">{completion.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full" style={{ width: `${completion.percent}%`, background: completion.color }} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-neutral-100 pt-4 text-p4 font-body text-neutral-600">
            {email && (
              <span className="inline-flex items-center gap-2">
                <Mail size={15} className="text-neutral-400" /> {email}
              </span>
            )}
            {contact.mobile && (
              <span className="inline-flex items-center gap-2">
                <Phone size={15} className="text-neutral-400" /> {contact.mobile}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} className="text-neutral-400" /> {location}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ============================================================== details */}
        <div className="space-y-6 xl:col-span-2">
          <SectionCard icon={<Building2 size={18} />} title="Organization details" tone="bg-primary-50 text-primary-800">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Organization name" value={view.organizationName} />
              <Field label="Buyer type" value={view.buyerTypeName} />
              <Field label="GST number" value={view.gstNumber} copyable={view.gstNumber || undefined} />
              <Field label="PAN number" value={view.panNumber} copyable={view.panNumber || undefined} />
            </div>
          </SectionCard>

          <SectionCard icon={<MapPin size={18} />} title="Address" tone="bg-blue-50 text-blue-700">
            {fullAddress && (
              <p className="mb-5 rounded-xl bg-neutral-50 px-4 py-3 text-p3 font-body text-neutral-800">{fullAddress}</p>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              <Field label="Building / street" value={[address.buildingNo, address.street].filter(Boolean).join(", ")} />
              <Field label="Landmark" value={address.landmark} />
              <Field label="City" value={address.city} />
              <Field label="Taluka" value={address.taluka} />
              <Field label="District" value={address.district} />
              <Field label="State" value={address.state} />
              <Field label="Pin code" value={address.pinCode} />
            </div>
          </SectionCard>

          <SectionCard icon={<UserRound size={18} />} title="Contact person" tone="bg-green-50 text-green-700">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Name" value={contact.name} />
              <Field label="Designation" value={contact.designation} />
              <Field
                label="Email"
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    {contact.email}
                    <Verified verified={contact.emailVerified} />
                  </span>
                }
              />
              <Field
                label="Mobile"
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    {contact.mobile}
                    <Verified verified={contact.phoneVerified} />
                  </span>
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* ============================================================ documents + help */}
        <aside className="space-y-6">
          <SectionCard icon={<FileText size={18} />} title="Documents & licenses" tone="bg-red-50 text-red-600">
            {documents.length === 0 ? (
              <p className="text-p3 font-body text-neutral-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-4">
                {documents.map((doc) => (
                  <li key={doc.key} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-p3 font-body font-semibold text-neutral-900">{doc.typeName || "Document"}</p>
                      <ExpiryChip expiry={doc.expiryDate} />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      No. {doc.number || "—"}
                      {doc.authority ? ` · ${doc.authority}` : ""}
                    </p>
                    {(doc.issueDate || doc.expiryDate) && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                        <Calendar size={12} />
                        {formatDate(doc.issueDate)} – {formatDate(doc.expiryDate)}
                      </p>
                    )}
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary-800 px-3 py-1.5 text-xs font-semibold text-primary-800 hover:bg-primary-50"
                      >
                        View document <ExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <section className="rounded-2xl border border-primary-100 bg-primary-50/50 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-800 shadow-sm">
                <Headset size={18} />
              </span>
              <div>
                <h2 className="text-p3 font-heading font-semibold text-neutral-900">Need to change something?</h2>
                <p className="mt-1 text-p4 font-body text-neutral-600">
                  Profile details can&apos;t be edited here yet. Write to us and the team will update them for you.
                </p>
                <a
                  href="mailto:buyer-support@tiameds.ai"
                  className="mt-3 inline-block text-p4 font-semibold text-primary-800 hover:underline"
                >
                  buyer-support@tiameds.ai
                </a>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
