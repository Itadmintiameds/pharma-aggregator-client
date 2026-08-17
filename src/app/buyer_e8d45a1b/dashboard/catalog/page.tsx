"use client";

import { Package, Star } from "lucide-react";

const SAMPLE_PRODUCTS = [
  { name: "Paracetamol 500mg Tablets", category: "Analgesic", packSize: "10x10 strip", moq: "500 units", price: "₹1.20 / unit", seller: "MedCore Pharma", rating: 4.6 },
  { name: "Amoxicillin 250mg Capsules", category: "Antibiotic", packSize: "10x10 strip", moq: "1000 units", price: "₹2.10 / unit", seller: "Wellness Labs", rating: 4.4 },
  { name: "Cetirizine 10mg Tablets", category: "Antihistamine", packSize: "10x15 strip", moq: "500 units", price: "₹0.95 / unit", seller: "MedCore Pharma", rating: 4.7 },
  { name: "ORS Sachets", category: "Rehydration", packSize: "1x50 box", moq: "200 boxes", price: "₹8.50 / sachet", seller: "HealthFirst Distributors", rating: 4.3 },
  { name: "Metformin 500mg Tablets", category: "Antidiabetic", packSize: "10x10 strip", moq: "1000 units", price: "₹1.75 / unit", seller: "Wellness Labs", rating: 4.5 },
  { name: "Surgical Gloves (Nitrile)", category: "Medical Devices", packSize: "1x100 box", moq: "50 boxes", price: "₹4.20 / pair", seller: "SafeCare Supplies", rating: 4.2 },
];

export default function BuyerCatalogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Browse Catalog</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Sample listing — live seller inventory search is coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_PRODUCTS.map((product) => (
          <div key={product.name} className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-05 text-primary-700 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <p className="text-p3 font-body font-semibold text-pneutral-900">{product.name}</p>
              <p className="text-label-l2 font-heading text-pneutral-500 mt-0.5">{product.category} · {product.packSize}</p>
            </div>
            <div className="flex items-center justify-between text-label-l2 font-heading text-pneutral-600">
              <span>MOQ: {product.moq}</span>
              <span className="flex items-center gap-1 text-warning-500">
                <Star size={12} fill="currentColor" /> {product.rating}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div>
                <p className="text-p3 font-body font-bold text-primary-800">{product.price}</p>
                <p className="text-label-l2 font-heading text-pneutral-500">{product.seller}</p>
              </div>
              <button className="text-label-l2 font-heading font-semibold text-primary-700 hover:underline">
                Request Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
