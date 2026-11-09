"use client";

import React from "react";
import { ShoppingBag, MessageSquareText, BarChart3, Truck, Lock } from "lucide-react";

const UNLOCK_ITEMS = [
  { icon: ShoppingBag, title: "Browse Medicines", description: "Access 10,000+ medicines from verified suppliers" },
  { icon: MessageSquareText, title: "Request RFQs", description: "Get competitive quotes from multiple suppliers" },
  { icon: BarChart3, title: "Compare Suppliers", description: "Compare pricing, MOQ, availability & more" },
  { icon: Truck, title: "Track Orders", description: "Track your orders and deliveries in real-time" },
];

// Static marketing grid shown while the buyer's registration is pending
// approval — no data dependency, purely illustrative of what unlocks once
// approved.
export default function BuyerUnlockGrid() {
  return (
    <div className="mt-8">
      <h2 className="text-h5 font-heading font-medium text-pneutral-900 mb-4">What you&apos;ll unlock after approval</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {UNLOCK_ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-800">
                <Icon size={20} />
              </span>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-pneutral-400">
                <Lock size={12} />
              </span>
            </div>
            <div>
              <p className="text-p3 font-body font-semibold text-pneutral-900">{title}</p>
              <p className="text-p4 font-body font-regular text-pneutral-500 mt-1">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
