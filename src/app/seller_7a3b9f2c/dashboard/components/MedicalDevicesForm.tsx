"use client";

import React, { useState } from "react";
import ConsumableForm from "./ConsumableForm";
import NonConsumableForm from "./NonConsumableForm";

const MedicalDevicesForm = () => {
  const [selectedType, setSelectedType] = useState<
    "consumable" | "non-consumable" | null
  >(null);

  return (
    <div className="mt-10">
      
      {/* CARD */}
      <div className="border border-neutral-200 rounded-2xl p-4 sm:p-6 bg-white">
        
        {/* HEADER */}
        <h2 className="text-h4 font-semibold mb-2">Product Details</h2>
        <div className="border-b border-neutral-200 mb-4"></div>

        {/* RADIO GROUP */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-10 mt-8">
          
          {/* Consumable */}
          <label className="flex items-start sm:items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="deviceType"
              value="consumable"
              checked={selectedType === "consumable"}
              onChange={() => setSelectedType("consumable")}
              className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
            />
            <span className="text-p5 font-semibold text-neutral-900 leading-snug">
              Consumable Medical Devices & Equipment
            </span>
          </label>

          {/* Non-Consumable */}
          <label className="flex items-start sm:items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="deviceType"
              value="non-consumable"
              checked={selectedType === "non-consumable"}
              onChange={() => setSelectedType("non-consumable")}
              className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
            />
            <span className="text-p5 font-semibold text-neutral-900 leading-snug">
              Non-Consumable Medical Devices & Equipment
            </span>
          </label>
        </div>
      </div>

      {/* FORMS OUTSIDE */}
      <div className="mt-6">
        {selectedType === "consumable" && <ConsumableForm />}
        {selectedType === "non-consumable" && <NonConsumableForm />}
      </div>
    </div>
  );
};

export default MedicalDevicesForm;