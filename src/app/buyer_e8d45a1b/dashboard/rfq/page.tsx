"use client";

import { ClipboardList } from "lucide-react";

// Sample data only — RFQ/quote requests are a B2B-specific flow that doesn't
// exist yet on the backend. Shows the section with representative content
// instead of a blank "under development" box until it's built.
const SAMPLE_RFQS = [
  { id: "RFQ-1042", product: "Paracetamol 500mg Tablets", quantity: "10,000 units", raisedOn: "2026-08-12", status: "Open", quotesReceived: 3 },
  { id: "RFQ-1038", product: "Surgical Gloves (Nitrile)", quantity: "2,000 boxes", raisedOn: "2026-08-09", status: "Quoted", quotesReceived: 5 },
  { id: "RFQ-1029", product: "Amoxicillin 250mg Capsules", quantity: "5,000 units", raisedOn: "2026-08-02", status: "Closed", quotesReceived: 2 },
];

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-info-50 text-info-600",
  Quoted: "bg-warning-50 text-warning-600",
  Closed: "bg-success-50 text-success-600",
};

export default function BuyerRfqPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h4 font-heading font-bold text-pneutral-900">RFQ & Quotes</h2>
          <p className="text-p3 font-body text-pneutral-600 mt-1">
            Sample requests — raising new RFQs is coming soon.
          </p>
        </div>
        <button className="px-4 py-2 rounded-md bg-primary-800 text-base-white text-label-l2 font-heading font-semibold">
          + New RFQ
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {SAMPLE_RFQS.map((rfq) => (
          <div key={rfq.id} className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center flex-shrink-0">
              <ClipboardList size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-p3 font-body font-semibold text-pneutral-900">{rfq.product}</p>
              <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5">
                {rfq.id} · Qty: {rfq.quantity} · Raised {rfq.raisedOn}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`inline-block px-2.5 py-1 rounded-full text-label-l2 font-heading font-medium ${STATUS_STYLES[rfq.status]}`}>
                {rfq.status}
              </span>
              <p className="text-label-l2 font-heading text-pneutral-500 mt-1">{rfq.quotesReceived} quotes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
