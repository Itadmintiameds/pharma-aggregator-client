"use client";

import React from "react";
import Input from "@/src/app/commonComponents/Input";

interface AdditionalDiscountProps {
  form: {
    additionalDiscountName: string;
    additionalDiscountValue: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

const AdditionalDiscount: React.FC<AdditionalDiscountProps> = ({
  form,
  onChange,
  onSave,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Additional Discount Name"
        name="additionalDiscountName"
        placeholder="e.g., Festival Offer"
        onChange={onChange}
        value={form.additionalDiscountName || ""}
      />

      <Input
        label="Discount Percentage"
        name="additionalDiscountValue"
        placeholder="e.g., 5"
        onChange={onChange}
        value={form.additionalDiscountValue || ""}
      />

      <button
        className="mt-4 px-4 py-2 bg-[#4B0082] text-white rounded-lg"
        onClick={onSave}
      >
        Save Discount
      </button>
    </div>
  );
};

export default AdditionalDiscount;