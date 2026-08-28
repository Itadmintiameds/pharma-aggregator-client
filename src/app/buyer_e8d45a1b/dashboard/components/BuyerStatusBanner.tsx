"use client";

import React from "react";
import { FaBuilding, FaBan } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi2";
import {
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Search,
  Mail,
  Briefcase,
  Info,
  FileText,
  Package,
  MessageSquare,
  Users,
  Bell,
} from "lucide-react";
import { BuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";

interface Props {
  status: BuyerOnboardingStatus;
  tempBuyer?: RawTempBuyer | null;
  onResume: () => void;
  onBack: () => void;
  // Only used by the submitted/under_review card's "View Submitted Details"
  // — unlike onResume (which reopens the editable wizard for
  // correction_required/rejected/draft), this shows a read-only recap
  // instead, since a fully submitted application shouldn't drop the buyer
  // back into the fill-in form. Falls back to onResume if omitted.
  onViewDetails?: () => void;
  // Whether a TempBuyer record already exists — distinguishes a brand-new
  // buyer (no draft started yet) from one resuming an in-progress draft, so
  // the "draft" card's CTA can say the right thing.
  hasDraft?: boolean;
  // Admin's comment for this status, if any (correction_required/rejected).
  reason?: string;
  reviewedAt?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary-100 text-secondary-700 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-p4 font-body text-pneutral-500">{label}</div>
        <div className="text-p3 font-heading font-semibold text-pneutral-900">{value}</div>
      </div>
    </div>
  );
}

// Full-width variant used by SubmittedCard's Application ID/Submitted On
// rows — label+icon on the left, value pushed to the right edge, unlike
// InfoRow's stacked label-above-value pair used by the other cards.
function InfoRowJustified({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-100 text-secondary-700 flex items-center justify-center shrink-0">
          <Icon size={14} />
        </div>
        <span className="text-p3 font-body text-pneutral-500">{label}</span>
      </div>
      <span className="text-p3 font-heading font-semibold text-pneutral-900">{value}</span>
    </div>
  );
}

// Light halo ring around a solid filled circle — used by SubmittedCard's
// headline icon (distinct from the flat solid-fill circles the other cards use).
function RingIcon({ icon: Icon, ringColor, fillColor }: { icon: React.ElementType; ringColor: string; fillColor: string }) {
  return (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${ringColor}`}>
      <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center ${fillColor}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">{children}</div>;
}

function OutlinedButton({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 px-5 rounded-xl border-2 border-secondary-600 text-secondary-600 font-body font-semibold text-p3 ${className}`}
    >
      {children}
    </button>
  );
}

function FilledButton({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={`h-11 px-5 rounded-xl bg-primary-800 text-white font-body font-semibold text-p3 ${className}`}>
      {children}
    </button>
  );
}

// -------------------------- Submitted / Under Review --------------------------

function SubmittedCard({ status, applicationId, submittedOn, onBack, onViewDetails }: {
  status: "submitted" | "under_review";
  applicationId: string;
  submittedOn: string;
  onBack: () => void;
  onViewDetails: () => void;
}) {
  const isUnderReview = status === "under_review";

  const whatHappensNext = [
    { icon: Search, text: "Our team reviews your organization and compliance information." },
    { icon: Mail, text: "You'll be notified if any correction or additional information is required." },
    { icon: CheckCircle2, text: "Once approved, your buyer account will be activated." },
    { icon: Briefcase, text: "You'll then be able to access Catalog, RFQ, Orders and other marketplace features." },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <div className="grid md:grid-cols-2 gap-y-8 pb-8 border-b border-neutral-200">
        <div className="flex flex-col items-center text-center md:pr-8 md:border-r md:border-neutral-200">
          <div className="mb-4">
            <RingIcon icon={Check} ringColor="bg-success-50" fillColor="bg-success-500" />
          </div>
          <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-2">
            {isUnderReview ? "Application Under Review" : "Application Submitted!"}
          </h2>
          <p className="text-p3 font-body text-pneutral-600 mb-6 w-full max-w-[28rem]">
            {isUnderReview
              ? "You've already submitted your organization details. Our team is reviewing your registration."
              : "Thank you! Your buyer registration has been successfully submitted for verification."}
          </p>
          <div className="flex flex-col gap-4 w-full border-t border-neutral-200 pt-5">
            <InfoRowJustified icon={HiDocumentText} label="Application ID" value={applicationId} />
            <InfoRowJustified icon={Clock} label="Submitted On" value={submittedOn} />
          </div>
        </div>

        <div className="md:pl-8">
          <div className="text-p4 font-body font-semibold text-secondary-700 tracking-wide mb-4">APPLICATION STATUS</div>
          <div className="flex flex-col">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-success-500 text-white flex items-center justify-center shrink-0">
                  <Check size={16} />
                </div>
                <div className="w-0.5 flex-1 bg-success-300 my-1" />
              </div>
              <div className="pb-4">
                <div className="text-p3 font-heading font-semibold text-pneutral-900">Registration Submitted</div>
                <div className="text-p4 font-body text-pneutral-500">{submittedOn}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-secondary-700 text-white flex items-center justify-center shrink-0">
                  <Clock size={14} />
                </div>
                <div className="w-0.5 flex-1 bg-neutral-200 my-1" />
              </div>
              <div className="pb-4 rounded-lg bg-primary-100 -mt-1 px-3 py-2">
                <div className="text-p3 font-heading font-semibold text-secondary-700">Admin Review (In Progress)</div>
                <div className="text-p4 font-body text-pneutral-600">Our team is reviewing your application.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-neutral-300 shrink-0" />
              <div>
                <div className="text-p3 font-heading font-semibold text-pneutral-400">Account Approval</div>
                <div className="text-p4 font-body text-pneutral-400">You will be notified once approved.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <div className="flex items-start gap-3 rounded-xl bg-primary-100 px-4 py-4">
          <div className="w-9 h-9 rounded-full bg-white/70 text-secondary-700 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-p4 font-body text-pneutral-600">Typical review time</div>
            <div className="text-p3 font-heading font-semibold text-pneutral-900">1 – 2 business days</div>
            <div className="text-p4 font-body text-pneutral-500 mt-0.5">We&apos;ll notify you by email and SMS when your application status changes.</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-success-50 px-4 py-4">
          <div className="w-9 h-9 rounded-full bg-success-500 text-white flex items-center justify-center shrink-0">
            <Lock size={16} />
          </div>
          <div>
            <div className="text-p3 font-heading font-semibold text-success-700">Your information is secure</div>
            <div className="text-p4 font-body text-success-700 mt-0.5">
              All your data and documents are encrypted and protected with industry-standard security.
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <div>
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mb-4">What happens next</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whatHappensNext.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-100 text-secondary-700 flex items-center justify-center">
                <Icon size={16} />
              </div>
              <p className="text-p4 font-body text-pneutral-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <CardFooter>
        <OutlinedButton onClick={onBack}>Back to Dashboard</OutlinedButton>
        <FilledButton onClick={onViewDetails}>View Submitted Details</FilledButton>
      </CardFooter>
      </div>
    </div>
  );
}

// -------------------------------- Approved --------------------------------

function ApprovedCard({ applicationId, approvedOn, onBack }: { applicationId: string; approvedOn: string; onBack: () => void }) {
  const whatYouCanDo = [
    { icon: Package, iconBg: "bg-primary-100 text-secondary-700", title: "Browse Catalog", body: "Explore thousands of pharma products" },
    { icon: MessageSquare, iconBg: "bg-success-50 text-success-600", title: "Create RFQ", body: "Request quotes from verified suppliers" },
    { icon: Users, iconBg: "bg-warning-50 text-warning-600", title: "Find Suppliers", body: "Connect with trusted pharma suppliers" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <div className="flex flex-col items-center text-center pb-8 border-b border-neutral-200">
        <div className="w-16 h-16 rounded-full bg-success-500 text-white flex items-center justify-center mb-4">
          <Check size={32} />
        </div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-1">Congratulations!</h2>
        <p className="text-p3 font-heading font-semibold text-secondary-700 mb-3">Your TiaMeds Buyer Account is Approved</p>
        <p className="text-p3 font-body text-pneutral-600 mb-6 w-full max-w-[32rem]">
          Verification completed successfully. You can now access the TiaMeds marketplace and start sourcing from verified suppliers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <InfoRow icon={FileText} label="Application ID" value={applicationId} />
          <InfoRow icon={Clock} label="Approved On" value={approvedOn} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mb-4">What you can do now</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {whatYouCanDo.map(({ icon: Icon, iconBg, title, body }) => (
            <div key={title} className="rounded-xl border border-neutral-200 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
                <Icon size={16} />
              </div>
              <div className="text-p3 font-heading font-semibold text-pneutral-900">{title}</div>
              <div className="text-p4 font-body text-pneutral-500 mt-0.5">{body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-primary-100 px-4 py-3.5 mt-6">
        <Briefcase size={18} className="text-secondary-700 shrink-0" />
        <p className="text-p3 font-heading font-semibold text-secondary-700">Welcome aboard! Your marketplace journey starts here.</p>
      </div>

      <CardFooter>
        <div />
        <OutlinedButton onClick={onBack}>Back to Dashboard</OutlinedButton>
      </CardFooter>
    </div>
  );
}

// --------------------------- Correction Required ---------------------------

// The backend only stores one application-level admin comment per review
// (TempBuyerReviewHistory has no per-document field) — every row below
// necessarily shares the same `issue` text, unlike a system that could
// flag specific documents individually.
function CorrectionRequiredCard({ applicationId, requestedOn, issue, documentNames, onBack, onResume }: {
  applicationId: string;
  requestedOn: string;
  issue: string;
  documentNames: string[];
  onBack: () => void;
  onResume: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-4">
        <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <div className="text-p3 font-heading font-semibold text-red-600">Action Required: Corrections Needed</div>
          <div className="text-p4 font-body text-red-500 mt-0.5">
            Our team has reviewed your application. Please address the following items and resubmit for review.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-8 mt-5">
        <InfoRow icon={FileText} label="Application ID" value={applicationId} />
        <InfoRow icon={Clock} label="Requested On" value={requestedOn} />
      </div>

      <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mt-8 mb-3">Items that need your attention</h3>
      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1.4fr_auto] gap-4 px-4 py-3 bg-neutral-100 text-p4 font-body font-semibold text-pneutral-600">
          <div>Document / Section</div>
          <div>Issue</div>
          <div>Action Required</div>
        </div>
        {documentNames.map((name, i) => (
          <div
            key={name}
            className={`grid grid-cols-[1fr_1.4fr_auto] gap-4 px-4 py-4 items-center ${i > 0 ? "border-t border-neutral-200" : ""}`}
          >
            <div className="flex items-center gap-2 text-p3 font-body font-semibold text-pneutral-900">
              <FileText size={16} className="text-pneutral-500 shrink-0" />
              {name}
            </div>
            <div>
              <div className="text-p3 font-body font-semibold text-pneutral-900">Needs correction</div>
              <div className="text-p4 font-body text-pneutral-500">{issue}</div>
            </div>
            <OutlinedButton onClick={onResume} className="h-9 px-4 text-p4">
              Re-upload
            </OutlinedButton>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-primary-100 px-4 py-3 mt-5">
        <Info size={16} className="text-secondary-700 mt-0.5 shrink-0" />
        <p className="text-p4 font-body text-secondary-700">
          You can edit other sections if required. Once corrected, submit your application again for review.
        </p>
      </div>

      <CardFooter>
        <OutlinedButton onClick={onBack}>Back to Dashboard</OutlinedButton>
        <FilledButton onClick={onResume}>Resubmit for Review</FilledButton>
      </CardFooter>
    </div>
  );
}

// -------------------------------- Rejected --------------------------------

function RejectedCard({ applicationId, reviewedOn, reason, onBack }: {
  applicationId: string;
  reviewedOn: string;
  reason: string;
  onBack: () => void;
}) {
  const nextSteps = [
    { icon: Search, text: "Review the reason above and reapply with correct information." },
    { icon: Bell, text: "Contact our support team if you need assistance." },
    { icon: FileText, text: "You can start a new application anytime." },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 w-full">
      <div className="flex flex-col items-center text-center pb-8 border-b border-neutral-200">
        <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-2">Application Rejected</h2>
        <p className="text-p3 font-body text-pneutral-600 mb-6">We are unable to approve your application at this time.</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <InfoRow icon={FileText} label="Application ID" value={applicationId} />
          <InfoRow icon={Clock} label="Reviewed On" value={reviewedOn} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mb-3">Reason for rejection</h3>
        <div className="rounded-xl bg-red-50 px-4 py-4">
          <p className="text-p3 font-body text-red-600">{reason}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mb-3">What can you do next</h3>
        <div className="flex flex-col gap-2">
          {nextSteps.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 text-p3 font-body text-pneutral-700">
              <Icon size={16} className="text-secondary-700 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      <CardFooter>
        <OutlinedButton onClick={onBack}>Back to Dashboard</OutlinedButton>
        <div />
      </CardFooter>
    </div>
  );
}

// ----------------------------- Generic fallback -----------------------------

const CARD_CONTENT: Partial<
  Record<BuyerOnboardingStatus, { icon: React.ElementType; iconBg: string; iconColor: string; title: string; body: string; cta?: string }>
> = {
  draft: {
    icon: FaBuilding,
    iconBg: "bg-primary-05",
    iconColor: "text-primary-700",
    title: "Let's get your organization registered",
    body: "Complete your organization, contact, and document details so we can review and approve your buyer account.",
    cta: "Resume Draft",
  },
  suspended: {
    icon: FaBan,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Account Suspended",
    body: "Your buyer account has been suspended. Please contact support for more information.",
  },
};

function documentNamesFor(tempBuyer?: RawTempBuyer | null): string[] {
  const fromDocs = (tempBuyer?.documents ?? [])
    .map((doc) => doc.documentType?.documentTypeName)
    .filter((name): name is string => !!name);
  if (fromDocs.length) return fromDocs;

  // No documents on the raw entity yet (e.g. draft never reached the
  // compliance step) — fall back to the section names the wizard always
  // shows so the table still has something to point the buyer at.
  const fallback = ["Drug License"];
  if (tempBuyer?.gstNumber) fallback.push("GST Certificate");
  if (tempBuyer?.panNumber) fallback.push("PAN Card");
  if (tempBuyer?.orgLogoUrl) fallback.push("Organization Logo");
  return fallback;
}

// Renders the state-specific card for one of the 7 real TempBuyerStatus
// states. draft/suspended keep the plain centered card; submitted/
// under_review/approved/correction_required/rejected get the dedicated
// full-width layouts matching the product reference designs.
export default function BuyerStatusBanner({ status, tempBuyer, onResume, onBack, onViewDetails, hasDraft, reason, reviewedAt }: Props) {
  const applicationId = tempBuyer?.tempBuyerRequestId || "—";
  const submittedOn = formatDate(tempBuyer?.createdAt);

  if (status === "submitted" || status === "under_review") {
    return (
      <SubmittedCard
        status={status}
        applicationId={applicationId}
        submittedOn={submittedOn}
        onBack={onBack}
        onViewDetails={onViewDetails ?? onResume}
      />
    );
  }

  if (status === "approved") {
    return <ApprovedCard applicationId={applicationId} approvedOn={formatDate(reviewedAt ?? tempBuyer?.updatedAt)} onBack={onBack} />;
  }

  if (status === "correction_required") {
    return (
      <CorrectionRequiredCard
        applicationId={applicationId}
        requestedOn={formatDate(reviewedAt)}
        issue={reason || "Please review your submitted details and documents."}
        documentNames={documentNamesFor(tempBuyer)}
        onBack={onBack}
        onResume={onResume}
      />
    );
  }

  if (status === "rejected") {
    return (
      <RejectedCard
        applicationId={applicationId}
        reviewedOn={formatDate(reviewedAt)}
        reason={reason || "Your application did not meet our verification requirements."}
        onBack={onBack}
      />
    );
  }

  const content = CARD_CONTENT[status];
  if (!content) return null;

  const Icon = content.icon;
  const cta = status === "draft" && !hasDraft ? "Start Registration" : content.cta;

  return (
    <div className="bg-base-white rounded-2xl shadow-lg max-w-[28rem] w-full p-10 text-center mt-4">
      <div className={`w-16 h-16 rounded-full ${content.iconBg} flex items-center justify-center mx-auto mb-6 ${content.iconColor}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-3">{content.title}</h2>
      <p className="text-p3 font-body text-pneutral-600 mb-6">{content.body}</p>
      {reason && (
        <p className="text-p3 font-body text-pneutral-800 bg-secondary-50 rounded-lg p-4 mb-6 text-left">
          <span className="font-semibold">Reviewer&apos;s note: </span>
          {reason}
        </p>
      )}
      {cta && (
        <button onClick={onResume} className="px-6 py-3 rounded-md bg-primary-800 text-base-white font-bold">
          {cta}
        </button>
      )}
    </div>
  );
}
