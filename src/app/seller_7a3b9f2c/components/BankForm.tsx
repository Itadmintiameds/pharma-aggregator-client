"use client";

import React, { useState } from "react";
import { Hash, Building2, MapPin, ChevronDown } from "lucide-react";
import { HiOutlineUser } from "react-icons/hi2";
import { IoLockClosedOutline } from "react-icons/io5";
import { RiBankLine } from "react-icons/ri";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";

interface BankFormData {
  accountHolderName: string;
  ifscCode: string;
  accountNumber: string;
  confirmAccountNumber: string;
  bankName: string;
  branch: string;
  bankStateId: number;
  bankDistrictId: number;
  bankTalukaId: number;
  cancelledChequeFile: File | null;
}

interface LoadingStates {
  states?: boolean;
  bankDistricts?: boolean;
  bankTalukas?: boolean;
  [key: string]: boolean | undefined;
}

interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  formData: BankFormData;
  ifscError: string;
  states: StateResponse[];
  bankDistricts: DistrictResponse[];
  bankTalukas: TalukaResponse[];
  loadingStates: LoadingStates;
  onIfscChange: (value: string) => void;
  onIfscBlur?: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckAccountMatch: () => boolean;
  onUpdateFormData?: (field: string, value: string) => void;
  onBankStateChange: (selected: SelectOption) => void;
  onBankDistrictChange: (selected: SelectOption) => void;
  onBankTalukaChange: (selected: SelectOption) => void;
  prevStep: () => void;
  nextStep: () => void;
}

export default function BankForm({
  formData,
  ifscError,
  states,
  bankDistricts,
  bankTalukas,
  loadingStates,
  onIfscChange,
  onIfscBlur,
  onFileChange,
  onAlphabetInput,
  onNumericInput,
  onChange,
  onCheckAccountMatch,
  onUpdateFormData,
  onBankStateChange,
  onBankDistrictChange,
  onBankTalukaChange,
  prevStep,
  nextStep
}: Props) {

  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [confirmAccountError, setConfirmAccountError] = useState("");

  // Custom dropdown open state, mirroring CompanyForm's address dropdown pattern.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const bankStateDropdownRef = React.useRef<HTMLDivElement>(null);
  const bankDistrictDropdownRef = React.useRef<HTMLDivElement>(null);
  const bankTalukaDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankStateDropdownRef.current && !bankStateDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'bankState') setOpenDropdown(null);
      }
      if (bankDistrictDropdownRef.current && !bankDistrictDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'bankDistrict') setOpenDropdown(null);
      }
      if (bankTalukaDropdownRef.current && !bankTalukaDropdownRef.current.contains(event.target as Node)) {
        if (openDropdown === 'bankTaluka') setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Custom dropdown divs have no native keyboard behavior. Enter/Space opens
  // them like a real select; the closing setTimeout (not an immediate close)
  // lets an option's onClick fire before the option list unmounts on blur,
  // since Tab/mouse-click-away both blur the div before the option's click
  // event would otherwise land on a removed node.
  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, name: string, enabled = true) => {
    if (!enabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenDropdown(openDropdown === name ? null : name);
    } else if (e.key === "Escape") {
      setOpenDropdown(null);
    }
  };

  const handleDropdownBlur = (name: string) => {
    setTimeout(() => {
      setOpenDropdown((current) => (current === name ? null : current));
    }, 150);
  };

  const getSelectedBankStateLabel = () => {
    const selected = states.find(s => s.stateId === formData.bankStateId);
    return selected?.stateName || "";
  };

  const getSelectedBankDistrictLabel = () => {
    const selected = bankDistricts.find(d => d.districtId === formData.bankDistrictId);
    return selected?.districtName || "";
  };

  const getSelectedBankTalukaLabel = () => {
    const selected = bankTalukas.find(t => t.talukaId === formData.bankTalukaId);
    return selected?.talukaName || "";
  };

  const selectedFileName = formData.cancelledChequeFile?.name || "";

  const handleIfscInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIfscChange(e.target.value);
  };

  // Blocks a wrong digit at the point of entry instead of validating after the
  // fact, so the confirm field can never end up holding a mismatched value.
  const handleConfirmAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");

    if (!formData.accountNumber) {
      setConfirmAccountError("Enter Bank Account Number first");
      return;
    }

    const truncated = digitsOnly.slice(0, formData.accountNumber.length);
    let matched = "";
    for (let i = 0; i < truncated.length; i++) {
      if (truncated[i] === formData.accountNumber[i]) {
        matched += truncated[i];
      } else {
        break;
      }
    }

    setConfirmAccountError(
      matched.length < truncated.length ? "Account number does not match" : ""
    );

    if (onUpdateFormData) {
      onUpdateFormData("confirmAccountNumber", matched);
    } else {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, name: "confirmAccountNumber", value: matched },
      };
      onChange(syntheticEvent);
    }
  };

const handleAccountHolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;
  
  // First, decode any HTML entities
  value = value.replace(/&amp;/g, '&');
  
  // Allow: letters, spaces, hyphens, dots, ampersands
  let cleaned = '';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (/[a-zA-Z\s\-\.&]/.test(char)) {
      cleaned += char;
    }
  }
  
  // Prevent consecutive spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  // cleaned = cleaned.trim();

  
  // Directly update form data without going through onAlphabetInput
  if (onUpdateFormData) {
    onUpdateFormData("accountHolderName", cleaned);
  } else {
    // Fallback - but this will still strip &
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: "accountHolderName", value: cleaned }
    };
    onAlphabetInput(syntheticEvent, "accountHolderName");
  }
};

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      setUploading(true);
      toast.info("Uploading document...");
      
      setTimeout(() => {
        onFileChange(e, 'cancelledChequeFile');
        setUploading(false);
        toast.success("Document uploaded");
      }, 1000);
    }
  };

  const handleContinue = () => {
    if (!onCheckAccountMatch()) {
      toast.error("Account number and confirm account number do not match");
      return;
    }

    if (!formData.bankStateId || !formData.bankDistrictId || !formData.bankTalukaId) {
      toast.error("Please select Bank State, District, and Taluka");
      return;
    }

    nextStep();
  };

  const handleConfirmAccountPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    toast.warning("Copy-paste is not allowed for confirm account number");
  };

  const handleConfirmAccountCopy = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    toast.warning("Copying is not allowed for confirm account number");
  };

  const handleConfirmAccountCut = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    toast.warning("Cutting is not allowed for confirm account number");
  };

  const handleConfirmAccountDrag = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    toast.warning("Drag and drop is not allowed for confirm account number");
  };

  return (
    <div className="flex flex-col gap-5 bg-white">
      {/* Header Section */}
      <div>
        <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Financial Setup
        </div>
        <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Banking details for secure settlements
        </div>
      </div>

      {/* Bank Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
          {/* Account Holder Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Account Holder Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="accountHolderName"
                autoComplete="off"
                value={formData.accountHolderName}
                // onChange={(e) => onAlphabetInput(e, "accountHolderName")}
                onChange={handleAccountHolderNameChange}
                placeholder="As per bank records"
                maxLength={100}
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              IFSC Code
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <input
                type="text"
                name="ifscCode"
                autoComplete="off"
                value={formData.ifscCode}
                onChange={handleIfscInput}
                onBlur={onIfscBlur}
                placeholder="e.g., SBIN0001234"
                maxLength={11}
                className={`w-full h-13 pl-10 pr-4 rounded-xl border focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 uppercase ${
                  ifscError ? 'border-red-500' : 'border-neutral-500'
                }`}
              />
            </div>
            {ifscError && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{ifscError}</span>
              </p>
            )}
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Bank Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="accountNumber"
                autoComplete="off"
                value={formData.accountNumber}
                onChange={(e) => onNumericInput(e, "accountNumber", 18)}
                placeholder="Enter Account number"
                maxLength={18}
                className="w-full h-13 pl-4 pr-10 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
            </div>
          </div>

          {/* Confirm Account Number - No copy-paste allowed */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Confirm Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="confirmAccountNumber"
                autoComplete="off"
                value={formData.confirmAccountNumber}
                onChange={handleConfirmAccountNumberChange}
                placeholder="Re-enter account number"
                maxLength={18}
                onPaste={handleConfirmAccountPaste}
                onCopy={handleConfirmAccountCopy}
                onCut={handleConfirmAccountCut}
                onDragStart={handleConfirmAccountDrag}
                onDrop={handleConfirmAccountDrag}
                className={`w-full h-13 pl-4 pr-10 rounded-xl border focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 ${
                  confirmAccountError ? 'border-red-500' : 'border-neutral-500'
                }`}
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
            </div>
            {confirmAccountError && (
              <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{confirmAccountError}</span>
              </p>
            )}
          </div>

          {/* Bank Name (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Bank Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <RiBankLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-500" />
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                readOnly
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 bg-gray-50 text-p4 font-body font-regular text-pneutral-900"
              />
            </div>
          </div>

          {/* Branch (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Branch
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-500" />
              <input
                type="text"
                name="branch"
                value={formData.branch}
                readOnly
                className="w-full h-13 pl-10 pr-4 rounded-xl border border-neutral-500 bg-gray-50 text-p4 font-body font-regular text-pneutral-900"
              />
            </div>
          </div>

          {/* Bank State */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Bank State
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={bankStateDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'bankState'}
                className="w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-800"
                onClick={() => setOpenDropdown(openDropdown === 'bankState' ? null : 'bankState')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'bankState')}
                onBlur={() => handleDropdownBlur('bankState')}
              >
                <span className={!getSelectedBankStateLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates?.states
                    ? "Loading..."
                    : getSelectedBankStateLabel() || "Select State"}
                </span>
                <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'bankState' ? 'rotate-180' : ''}`} />
              </div>

              {openDropdown === 'bankState' && !loadingStates?.states && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {states.map((state) => (
                      <div
                        key={state.stateId}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => {
                          onBankStateChange({ value: state.stateId.toString(), label: state.stateName });
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {state.stateName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank District */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Bank District
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={bankDistrictDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                tabIndex={formData.bankStateId ? 0 : -1}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'bankDistrict'}
                className={`w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-800 ${formData.bankStateId ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'}`}
                onClick={() => formData.bankStateId && setOpenDropdown(openDropdown === 'bankDistrict' ? null : 'bankDistrict')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'bankDistrict', !!formData.bankStateId)}
                onBlur={() => handleDropdownBlur('bankDistrict')}
              >
                <span className={!getSelectedBankDistrictLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates?.bankDistricts
                    ? "Loading..."
                    : getSelectedBankDistrictLabel() || "Select District"}
                </span>
                {formData.bankStateId && (
                  <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'bankDistrict' ? 'rotate-180' : ''}`} />
                )}
              </div>

              {openDropdown === 'bankDistrict' && !loadingStates?.bankDistricts && formData.bankStateId && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {bankDistricts.map((district) => (
                      <div
                        key={district.districtId}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => {
                          onBankDistrictChange({ value: district.districtId.toString(), label: district.districtName });
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {district.districtName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Taluka */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
              Bank Taluka
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={bankTalukaDropdownRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pneutral-900" />
              <div
                tabIndex={formData.bankDistrictId ? 0 : -1}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'bankTaluka'}
                className={`w-full h-13 pl-10 pr-4 border border-neutral-500 rounded-xl bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary-800 ${formData.bankDistrictId ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'}`}
                onClick={() => formData.bankDistrictId && setOpenDropdown(openDropdown === 'bankTaluka' ? null : 'bankTaluka')}
                onKeyDown={(e) => handleDropdownKeyDown(e, 'bankTaluka', !!formData.bankDistrictId)}
                onBlur={() => handleDropdownBlur('bankTaluka')}
              >
                <span className={!getSelectedBankTalukaLabel() ? "text-p4 font-body font-regular text-pneutral-500" : "text-p4 font-body font-regular text-pneutral-900"}>
                  {loadingStates?.bankTalukas
                    ? "Loading..."
                    : getSelectedBankTalukaLabel() || "Select Taluka"}
                </span>
                {formData.bankDistrictId && (
                  <ChevronDown className={`w-5 h-5 text-pneutral-900 transition-transform ${openDropdown === 'bankTaluka' ? 'rotate-180' : ''}`} />
                )}
              </div>

              {openDropdown === 'bankTaluka' && !loadingStates?.bankTalukas && formData.bankDistrictId && (
                <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="max-h-60 overflow-y-auto">
                    {bankTalukas.map((taluka) => (
                      <div
                        key={taluka.talukaId}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                        onClick={() => {
                          onBankTalukaChange({ value: taluka.talukaId.toString(), label: taluka.talukaName });
                          setOpenDropdown(null);
                        }}
                      >
                        <span className="text-p4 font-body font-regular text-pneutral-900">
                          {taluka.talukaName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section - KEPT ORIGINAL DESIGN */}
      <div className="mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px] mb-2">
            Upload cancelled Cheque / Passbook front page copy
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div
            tabIndex={uploading ? -1 : 0}
            role="button"
            aria-label="Upload cancelled Cheque / Passbook front page copy"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                document.getElementById('cheque-upload')?.click();
              }
            }}
            className="border-2 border-dashed border-primary-300 rounded-xl p-8 text-center bg-neutral-50 cursor-pointer transition-none focus:outline-none focus:ring-2 focus:ring-primary-800"
            onClick={() => document.getElementById('cheque-upload')?.click()}
          >
            <input
              id="cheque-upload"
              type="file"
              name="cancelledChequeFile"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
            />

            <div className="flex flex-col items-center gap-2">
              <Image
                src="/icons/folder.png"
                alt="Upload"
                width={40}
                height={40}
              />
              {uploading ? (
                <p className="text-p4 font-body font-regular text-pneutral-500">Uploading...</p>
              ) : selectedFileName ? (
                <div className="flex items-center gap-2">
                  <p className="text-p4 font-body font-regular text-pneutral-900">
                    {selectedFileName}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const syntheticEvent = {
                        target: { files: null }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      onFileChange(syntheticEvent, 'cancelledChequeFile');
                      const fileInput = document.getElementById('cheque-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove file"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-p4 font-body font-regular text-pneutral-900">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-p2 font-body font-regular text-pneutral-500">
                    JPEG, PNG, and PDF formats, up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-pneutral-900 text-pneutral-900 font-semibold"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={18}
              height={18}
            />
            Back
          </button>

          <button
            onClick={handleContinue}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-800 text-primary-800 font-semibold"
          >
            Continue
            <Image
              src="/icons/continueicon.png"
              alt="Continue"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>
    </div>
  );
}