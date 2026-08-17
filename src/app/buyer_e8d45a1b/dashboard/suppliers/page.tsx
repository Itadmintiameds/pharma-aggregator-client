"use client";

import { Warehouse, MapPin, Star } from "lucide-react";

// Sample data only — a supplier shortlist/favorites feature doesn't exist
// yet. Shows the section with representative content instead of a blank
// "under development" box until it's built.
const SAMPLE_SUPPLIERS = [
  { name: "MedCore Pharma", location: "Ahmedabad, Gujarat", categories: "Analgesics, Antihistamines", rating: 4.6 },
  { name: "Wellness Labs", location: "Hyderabad, Telangana", categories: "Antibiotics, Antidiabetics", rating: 4.4 },
  { name: "HealthFirst Distributors", location: "Pune, Maharashtra", categories: "OTC, Rehydration", rating: 4.3 },
  { name: "SafeCare Supplies", location: "Chennai, Tamil Nadu", categories: "Medical Devices, PPE", rating: 4.2 },
];

export default function BuyerSuppliersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Saved Suppliers</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Sample shortlist — saving your own suppliers is coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SAMPLE_SUPPLIERS.map((supplier) => (
          <div key={supplier.name} className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-05 text-primary-700 flex items-center justify-center flex-shrink-0">
              <Warehouse size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-p3 font-body font-semibold text-pneutral-900">{supplier.name}</p>
              <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5 flex items-center gap-1">
                <MapPin size={12} /> {supplier.location}
              </p>
              <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5">{supplier.categories}</p>
            </div>
            <span className="flex items-center gap-1 text-warning-500 text-label-l2 font-heading font-medium flex-shrink-0">
              <Star size={14} fill="currentColor" /> {supplier.rating}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
