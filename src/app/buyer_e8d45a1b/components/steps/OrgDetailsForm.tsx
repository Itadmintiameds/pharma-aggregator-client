"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building2, Hash } from "lucide-react";
import FormInput from "@/src/app/seller_7a3b9f2c/components/FormInput";
import { BuyerTypeResponse, StateResponse, DistrictResponse, TalukaResponse } from "@/src/services/buyer/BuyerRegMasterService";
import { buyerRegistrationService } from "@/src/services/buyer/buyerRegistrationService";
import { BuyerFormData } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  errors: Record<string, string>;
  buyerTypes: BuyerTypeResponse[];
  states: StateResponse[];
  districts: DistrictResponse[];
  talukas: TalukaResponse[];
  loadingBuyerTypes: boolean;
  loadingStates: boolean;
  loadingDistricts: boolean;
  loadingTalukas: boolean;
  tempBuyerId: number | null;
  onChange: (field: string, value: unknown) => void;
  onBuyerTypeChange: (buyerTypeId: number) => void;
  onStateChange: (stateId: number) => void;
  onDistrictChange: (districtId: number) => void;
  onTalukaChange: (talukaId: number) => void;
  prevStep: () => void;
  nextStep: () => void;
}

export default function OrgDetailsForm({
  formData,
  errors,
  buyerTypes,
  states,
  districts,
  talukas,
  loadingBuyerTypes,
  loadingStates,
  loadingDistricts,
  loadingTalukas,
  tempBuyerId,
  onChange,
  onBuyerTypeChange,
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  prevStep,
  nextStep,
}: Props) {
  const [gstExistsError, setGstExistsError] = useState("");
  const [panExistsError, setPanExistsError] = useState("");

  const handleGstBlur = async () => {
    const gst = (formData.gstNumber || "").trim();
    if (!gst) {
      setGstExistsError("");
      return;
    }
    try {
      const exists = await buyerRegistrationService.checkGSTNumber(gst, tempBuyerId);
      setGstExistsError(exists ? "This GST number is already registered. Please use a different GST number." : "");
    } catch {
      setGstExistsError("");
    }
  };

  const handlePanBlur = async () => {
    const pan = (formData.panNumber || "").trim();
    if (!pan) {
      setPanExistsError("");
      return;
    }
    try {
      const exists = await buyerRegistrationService.checkPANNumber(pan, tempBuyerId);
      setPanExistsError(exists ? "This PAN number is already registered. Please use a different PAN number." : "");
    } catch {
      setPanExistsError("");
    }
  };

  const handleContinue = () => {
    if (gstExistsError || panExistsError) return;
    nextStep();
  };
  return (
    <div className="flex flex-col gap-5 bg-white">
      <div>
        <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Organization details
        </div>
        <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Tell us about your organization and its registered address
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
        <FormInput
          label="Organization Name"
          required
          type="text"
          value={formData.organizationName}
          onChange={(e) => onChange("organizationName", e.target.value)}
          placeholder="Enter organization name"
          leftIcon={<Building2 className="w-5 h-5" />}
          error={errors.organizationName}
        />

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            Buyer Type
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <select
            value={formData.buyerTypeId || ""}
            onChange={(e) => onBuyerTypeChange(parseInt(e.target.value, 10) || 0)}
            disabled={loadingBuyerTypes}
            className={`w-full h-13 pl-5 pr-4 rounded-xl border ${
              errors.buyerTypeId ? "border-red-500" : "border-neutral-500"
            } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
          >
            <option value="">Select buyer type</option>
            {buyerTypes.map((bt) => (
              <option key={bt.buyerTypeId} value={bt.buyerTypeId}>
                {bt.buyerTypeName}
              </option>
            ))}
          </select>
          {errors.buyerTypeId && <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.buyerTypeId}</p>}
        </div>

        <FormInput
          label="GST Number"
          type="text"
          uppercase
          value={formData.gstNumber}
          onChange={(e) => {
            onChange("gstNumber", e.target.value.toUpperCase());
            setGstExistsError("");
          }}
          onBlur={handleGstBlur}
          placeholder="Enter GST number"
          maxLength={15}
          leftIcon={<Hash className="w-5 h-5" />}
          error={errors.gstNumber || gstExistsError}
          hint={!errors.gstNumber && !gstExistsError ? "Provide either GST or PAN number" : undefined}
        />

        <FormInput
          label="PAN Number"
          type="text"
          uppercase
          value={formData.panNumber}
          onChange={(e) => {
            onChange("panNumber", e.target.value.toUpperCase());
            setPanExistsError("");
          }}
          onBlur={handlePanBlur}
          placeholder="Enter PAN number"
          maxLength={10}
          leftIcon={<Hash className="w-5 h-5" />}
          error={errors.panNumber || panExistsError}
        />

        <FormInput
          label="Building / Flat No."
          required
          type="text"
          value={formData.buildingNo}
          onChange={(e) => onChange("buildingNo", e.target.value)}
          placeholder="Enter building/flat number"
          error={errors.buildingNo}
        />

        <FormInput
          label="Street"
          required
          type="text"
          value={formData.street}
          onChange={(e) => onChange("street", e.target.value)}
          placeholder="Enter street"
          error={errors.street}
        />

        <FormInput
          label="Landmark"
          type="text"
          value={formData.landmark}
          onChange={(e) => onChange("landmark", e.target.value)}
          placeholder="Enter landmark (optional)"
        />

        <FormInput
          label="City"
          required
          type="text"
          value={formData.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="Enter city"
          error={errors.city}
        />

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            State
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <select
            value={formData.stateId || ""}
            onChange={(e) => onStateChange(parseInt(e.target.value, 10) || 0)}
            disabled={loadingStates}
            className={`w-full h-13 pl-5 pr-4 rounded-xl border ${
              errors.stateId ? "border-red-500" : "border-neutral-500"
            } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s.stateId} value={s.stateId}>
                {s.stateName}
              </option>
            ))}
          </select>
          {errors.stateId && <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.stateId}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            District
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <select
            value={formData.districtId || ""}
            onChange={(e) => onDistrictChange(parseInt(e.target.value, 10) || 0)}
            disabled={loadingDistricts || !formData.stateId}
            className={`w-full h-13 pl-5 pr-4 rounded-xl border ${
              errors.districtId ? "border-red-500" : "border-neutral-500"
            } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.districtName}
              </option>
            ))}
          </select>
          {errors.districtId && <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.districtId}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            Taluka
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <select
            value={formData.talukaId || ""}
            onChange={(e) => onTalukaChange(parseInt(e.target.value, 10) || 0)}
            disabled={loadingTalukas || !formData.districtId}
            className={`w-full h-13 pl-5 pr-4 rounded-xl border ${
              errors.talukaId ? "border-red-500" : "border-neutral-500"
            } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
          >
            <option value="">Select taluka</option>
            {talukas.map((t) => (
              <option key={t.talukaId} value={t.talukaId}>
                {t.talukaName}
              </option>
            ))}
          </select>
          {errors.talukaId && <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.talukaId}</p>}
        </div>

        <FormInput
          label="PIN Code"
          required
          type="text"
          value={formData.pinCode}
          onChange={(e) => onChange("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit PIN code"
          maxLength={6}
          error={errors.pinCode}
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>

        <button
          onClick={handleContinue}
          className="h-12 px-6 border-2 border-primary-800 text-primary-800 rounded-xl flex items-center gap-2"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
