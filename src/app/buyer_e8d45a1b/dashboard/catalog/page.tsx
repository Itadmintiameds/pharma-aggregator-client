"use client";

import UnderDevelopment from "../components/UnderDevelopment";

export default function BuyerCatalogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Browse Catalog</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Live seller inventory search is coming soon.
        </p>
      </div>

      <UnderDevelopment title="Browse Catalog" />
    </div>
  );
}
