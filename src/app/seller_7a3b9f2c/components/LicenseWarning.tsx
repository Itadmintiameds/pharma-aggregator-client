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
      <div className="w-120 rounded-3xl bg-white p-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-13 w-13 items-center justify-center">
            <Image
              src="/icons/warning.png"
              alt="warning"
              width={40}
              height={40}
            />
          </div>

          <h2 className="text-h6 font-semibold text-warning-500">
            Warning - Duplicate License Number
          </h2>
        </div>

        {/* Content Box */}
        <div className="mt-6 rounded-2xl border border-danger-500 bg-danger-100 px-4 py-4">
          <p className="text-p4 font-medium text-pneutral-800">
            License No.{" "}
            <span className="font-semibold">{licenseNumber}</span> is already
            been used for{" "}
            <span className="font-semibold">{formattedProductNames}</span>.
          </p>

          <p className="mt-4 text-p4 font-medium text-pneutral-800">
            Do you want to continue using the same license no. for{" "}
            <span className="font-semibold">{newProductName}</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="
              h-12
              rounded-xl
              border-2
              border-warning-500
              px-7
              text-l4
              font-medium text-warning-500
            "
          >
            No, Clear Field
          </button>

          <button
            onClick={onConfirm}
            className="
              h-12
              rounded-xl
              bg-success-900
              px-8
              text-[18px]
              font-medium
              text-pneutral-50
            "
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  );
}