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
    <div className="mt-4">
      <h2 className="mb-2 text-sm font-heading font-bold text-pneutral-900">What you&apos;ll unlock after approval</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {UNLOCK_ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 text-primary-800">
                <Icon size={16} />
              </span>
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 text-pneutral-400">
                <Lock size={11} />
              </span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-pneutral-900">{title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
