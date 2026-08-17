import React from "react";

// Buyer-owned fork of seller's dashboard/components/KpiCard.tsx — same visual
// language (rounded card, icon chip, growth line), kept duplicated rather
// than imported cross-module like the rest of the buyer dashboard.
interface BuyerKpiCardProps {
  title: string;
  value: number | string;
  growth?: string;
  icon: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function BuyerKpiCard({ title, value, growth, icon, className = "", style }: BuyerKpiCardProps) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border border-neutral-100 transition-all duration-300 ${className}`}
      style={style}
    >
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-base font-semibold font-heading text-black leading-tight">{title}</h4>
        <div className="p-2.5 bg-yellow-50 rounded-lg">{icon}</div>
      </div>

      <h2 className="text-3xl font-bold font-heading text-neutral-900">{value}</h2>

      {growth && (
        <p className="text-sm mt-2 font-body text-success-900">
          {growth} <span className="text-black font-medium">From last month</span>
        </p>
      )}
    </div>
  );
}
