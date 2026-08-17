"use client";

import { AlertTriangle, ShieldCheck, FileWarning } from "lucide-react";
import { RawTempBuyerDocument } from "@/src/services/buyer/buyerRegistrationService";

interface DocumentExpiryCardProps {
  documents?: RawTempBuyerDocument[];
}

const WARN_WINDOW_DAYS = 60;

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Buyer-specific dashboard feature with no seller equivalent: a B2B pharma
// buyer's licenses/documents (drug license, GST cert, etc.) have real expiry
// dates that gate compliance, so surfacing "expiring soon" up front on the
// overview is directly useful — unlike the mock KPI/chart cards above, this
// reads real data already fetched by useBuyerOnboardingStatus().
export default function DocumentExpiryCard({ documents }: DocumentExpiryCardProps) {
  const withExpiry = (documents ?? [])
    .map((doc) => ({ doc, days: daysUntil(doc.licenseExpiryDate) }))
    .filter((entry): entry is { doc: RawTempBuyerDocument; days: number } => entry.days !== null)
    .sort((a, b) => a.days - b.days);

  const expiringOrExpired = withExpiry.filter((entry) => entry.days <= WARN_WINDOW_DAYS);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center">
          <FileWarning size={16} />
        </span>
        <h3 className="text-lg font-semibold font-heading text-black">Document Expiry</h3>
      </div>

      {withExpiry.length === 0 ? (
        <p className="text-sm font-body text-neutral-500">No license expiry dates on file.</p>
      ) : expiringOrExpired.length === 0 ? (
        <div className="flex items-center gap-2 text-success-900">
          <ShieldCheck size={18} />
          <p className="text-sm font-body">All documents are valid for the next {WARN_WINDOW_DAYS}+ days.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100">
          {expiringOrExpired.map(({ doc, days }, index) => (
            <div key={doc.tempBuyerDocumentId ?? index} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
              <AlertTriangle size={16} className={days < 0 ? "text-red-500" : "text-warning-600"} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-heading text-black truncate">
                  {doc.documentType?.documentTypeName || "Document"}
                </p>
                <p className={`text-xs font-body ${days < 0 ? "text-red-500" : "text-warning-600"}`}>
                  {days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
