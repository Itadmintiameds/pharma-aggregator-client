"use client";

import { PhoneCall, Mail, MessageSquareText } from "lucide-react";

// Sample data only — a support ticketing system doesn't exist yet. Shows the
// section with representative content instead of a blank "under development"
// box until it's built.
const FAQS = [
  { q: "How do I raise an RFQ for a product?", a: "Go to RFQ & Quotes and click \"New RFQ\" — this feature is coming soon." },
  { q: "How long does order delivery usually take?", a: "Delivery timelines vary by seller and location, typically 3–7 business days." },
  { q: "Who do I contact for a rejected registration?", a: "Reach out to our support team using the contact details below and we'll help you resubmit." },
];

export default function BuyerSupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Support</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Sample help content — a full ticketing system is coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <span className="w-10 h-10 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center">
            <PhoneCall size={18} />
          </span>
          <p className="text-p3 font-body font-semibold text-pneutral-900">Call Us</p>
          <p className="text-label-l2 font-heading text-pneutral-500">+91 1800-123-4567</p>
        </div>
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <span className="w-10 h-10 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center">
            <Mail size={18} />
          </span>
          <p className="text-p3 font-body font-semibold text-pneutral-900">Email Us</p>
          <p className="text-label-l2 font-heading text-pneutral-500">support@tiameds.ai</p>
        </div>
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <span className="w-10 h-10 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center">
            <MessageSquareText size={18} />
          </span>
          <p className="text-p3 font-body font-semibold text-pneutral-900">Raise a Ticket</p>
          <p className="text-label-l2 font-heading text-pneutral-500">Available soon</p>
        </div>
      </div>

      <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h3 className="text-p2 font-heading font-semibold text-pneutral-900 mb-4">Frequently Asked Questions</h3>
        <div className="flex flex-col divide-y divide-neutral-100">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-3 first:pt-0 last:pb-0">
              <p className="text-p3 font-body font-semibold text-pneutral-900">{faq.q}</p>
              <p className="text-p3 font-body text-pneutral-600 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
