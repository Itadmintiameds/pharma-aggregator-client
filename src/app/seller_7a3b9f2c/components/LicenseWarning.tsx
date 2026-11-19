"use client";

import React from "react";
import Image from "next/image";

interface LicenseWarningProps {
  isOpen: boolean;
  licenseNumber: string;
  existingProductNames: string[]; 
  newProductName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatProductNames = (names: string[]): string => {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  
  // For 3 or more: "XYZ, EFGH & PQRS"
  const lastItem = names[names.length - 1];
  const otherItems = names.slice(0, -1).join(", ");
  return `${otherItems} & ${lastItem}`;
};

export default function LicenseWarning({
  isOpen,
  licenseNumber,
  existingProductNames,
  newProductName,
  onConfirm,
  onCancel,
}: LicenseWarningProps) {
  if (!isOpen) return null;

  const formattedProductNames = formatProductNames(existingProductNames);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur">
      <div className="w-full max-w-[28rem] mx-4 rounded-xl bg-white p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center">
            <Image
              src="/icons/warning.png"
              alt="warning"
              width={28}
              height={28}
            />
          </div>

          <h2 className="text-base font-bold text-warning-500">
            Warning - Duplicate License Number
          </h2>
        </div>

        {/* Content Box */}
        <div className="mt-3 rounded-lg border border-danger-500 bg-danger-100 px-3 py-3">
          <p className="text-[13px] font-medium text-pneutral-800">
            License No.{" "}
            <span className="font-semibold">{licenseNumber}</span> is already
            been used for{" "}
            <span className="font-semibold">{formattedProductNames}</span>.
          </p>

          <p className="mt-2 text-[13px] font-medium text-pneutral-800">
            Do you want to continue using the same license no. for{" "}
            <span className="font-semibold">{newProductName}</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="h-9 rounded-lg border-[1.5px] border-warning-500 px-4 text-[13px] font-semibold text-warning-500 hover:bg-warning-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-100"
          >
            No, Clear Field
          </button>

          <button
            onClick={onConfirm}
            className="h-9 rounded-lg border-[1.5px] border-success-900 px-4 text-[13px] font-semibold text-success-900 hover:bg-success-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-100"
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  );
}