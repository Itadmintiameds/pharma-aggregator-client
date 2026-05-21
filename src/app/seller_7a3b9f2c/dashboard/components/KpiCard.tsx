import React from "react";


interface KpiCardProps {
  title: string;
  value: number | string;
  growth?: string;
  icon: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  growth,
  icon,
  className = "",
  style,
}) => {
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border border-neutral-100 transition-all duration-300 ${className}`}
      style={style}
    >
     {/* <div 
       className="p-6 rounded-2xl shadow-sm border bg-white border-neutral-100 transition-all duration-300 cursor-pointer hover:bg-primary-05 hover:shadow-md"
     > */}
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-base font-semibold font-heading text-black leading-tight">{title}</h4>
        <div className="p-2.5 bg-yellow-50 rounded-lg">
          {icon}
        </div>
      </div>

      <h2 className="text-3xl font-bold font-heading text-neutral-900">{value}</h2>

      {growth && (
        <p className="text-sm mt-2 font-body text-success-900">
          {growth} <span className="text-black font-medium">From last month</span>
        </p>
      )}
    </div>
  );
};

export default KpiCard;