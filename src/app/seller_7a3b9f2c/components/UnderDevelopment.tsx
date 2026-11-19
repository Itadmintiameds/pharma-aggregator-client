"use client";

import { Construction } from "lucide-react";

interface UnderDevelopmentProps {
  title: string;
}

const UnderDevelopment = ({ title }: UnderDevelopmentProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white rounded-xl border border-neutral-200 shadow-sm py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-primary-05 flex items-center justify-center mb-4">
        <Construction size={24} className="text-primary-700" />
      </div>
      <h2 className="text-base font-bold text-neutral-900 mb-1">{title}</h2>
      <p className="text-[13px] text-neutral-500" style={{ maxWidth: 384 }}>
        This page is under development. We&apos;re working on it and it will be available soon.
      </p>
    </div>
  );
};

export default UnderDevelopment;
