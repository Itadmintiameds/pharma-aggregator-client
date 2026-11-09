"use client";

import UnderDevelopment from "../components/UnderDevelopment";

export default function BuyerSuppliersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Saved Suppliers</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Saving your own suppliers is coming soon.
        </p>
      </div>

      <UnderDevelopment title="Saved Suppliers" />
    </div>
  );
}
