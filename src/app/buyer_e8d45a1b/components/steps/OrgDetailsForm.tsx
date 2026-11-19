"use client";

import React from "react";
import Image from "next/image";
import { Building2, Boxes, CheckCircle2, MapPin } from "lucide-react";
import FormInput from "@/src/app/seller_7a3b9f2c/components/FormInput";
import { BuyerTypeResponse, StateResponse, DistrictResponse, TalukaResponse } from "@/src/services/buyer/BuyerRegMasterService";
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
  onChange: (field: string, value: unknown) => void;
  onBuyerTypeChange: (buyerTypeId: number) => void;
  onStateChange: (stateId: number) => void;
  onDistrictChange: (districtId: number) => void;
  onTalukaChange: (talukaId: number) => void;
  nextStep: () => void;
  // First step of the wizard — no previous step to go back to. When
  // embedded (see BuyerRegister.tsx), this lets the buyer exit back to the
  // onboarding hub instead.
  onExitToIntro?: () => void;
}

function SectionDivider({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-700 text-white shrink-0">
        <Icon size={13} />
      </span>
      <h3 className="text-p3 font-body font-semibold text-secondary-700 whitespace-nowrap">{label}</h3>
      <div className="flex-1 border-t border-neutral-200" />
    </div>
  );
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
  onChange,
  onBuyerTypeChange,
  onStateChange,
  onDistrictChange,
  onTalukaChange,
  nextStep,
  onExitToIntro,
}: Props) {
  return (
    <div className="flex flex-col gap-6 bg-white">
      <div className="flex items-start gap-4 pb-5 border-b border-neutral-200">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-700 text-white shrink-0">
          <Boxes size={22} />
        </span>
        <div>
          <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
            Organization details
          </div>
          <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
            Tell us about your organization and its registered address
          </div>
        </div>
      </div>

      <SectionDivider icon={CheckCircle2} label="Business information" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-pneutral-900 pointer-events-none">
              <Boxes className="w-5 h-5" />
            </div>
            <select
              value={formData.buyerTypeId || ""}
              onChange={(e) => onBuyerTypeChange(parseInt(e.target.value, 10) || 0)}
              disabled={loadingBuyerTypes}
              className={`w-full h-13 pl-10 pr-4 rounded-xl border ${
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
          </div>
          {errors.buyerTypeId && <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.buyerTypeId}</p>}
        </div>
      </div>

      <SectionDivider icon={MapPin} label="Registered address" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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

      <div className="flex items-center justify-between mt-2 pt-5 border-t border-neutral-200">
        <button
          onClick={onExitToIntro}
          disabled={!onExitToIntro}
          className="h-12 px-6 border-2 border-secondary-600 text-secondary-600 rounded-xl flex items-center gap-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>

        <span className="hidden sm:flex items-center gap-1.5 text-p3 font-body font-regular text-success-600">
          <CheckCircle2 size={16} />
          Your progress is saved automatically
        </span>

        <button
          onClick={nextStep}
          className="h-12 px-6 rounded-xl bg-primary-800 text-white flex items-center gap-2 font-semibold"
        >
          Save &amp; Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} className="brightness-0 invert" />
        </button>
      </div>
    </div>
  );
}
