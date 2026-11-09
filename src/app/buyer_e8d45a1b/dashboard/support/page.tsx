"use client";

import UnderDevelopment from "../components/UnderDevelopment";

export default function BuyerSupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Support</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          A full support/ticketing system is coming soon.
        </p>
      </div>

      <UnderDevelopment title="Support" />
    </div>
  );
}
