"use client";

import React, { useState } from "react";
import { Hash, Building2, MapPin } from "lucide-react";
import { HiOutlineUser } from "react-icons/hi2";
import { IoLockClosedOutline } from "react-icons/io5";
import { RiBankLine } from "react-icons/ri";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Props {
  formData: any;
  ifscError: string;
  onIfscChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckAccountMatch: () => boolean;
  prevStep: () => void;
  nextStep: () => void;
}

export default function BankForm({
  formData,
  ifscError,
  onIfscChange,
  onFileChange,
  onAlphabetInput,
  onNumericInput,
  onChange,
  onCheckAccountMatch,
  prevStep,
  nextStep
}: Props) {

  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  
  // Derive file name directly from formData
  const selectedFileName = formData.cancelledChequeFile?.name || "";

  const handleIfscInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIfscChange(e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      toast.info("Uploading document...");
      
      // Simulate upload delay (1 second)
      setTimeout(() => {
        onFileChange(e, 'cancelledChequeFile');
        setUploading(false);
        toast.success("Document uploaded");
      }, 1000);
    }
  };

  const handleContinue = () => {
    // Check if account number and confirm account number match
    if (!onCheckAccountMatch()) {
      toast.error("Account number and confirm account number do not match");
      return;
    }
    
    // Proceed to next step if validation passes
    nextStep();
  };

  // Prevent copy-paste on confirm account number field
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
    <div className="flex flex-col gap-5">
      {/* Header Section */}
      <div>
        <div className="text-h2 font-semibold">Financial Setup</div>
        <div className="text-label-l3 text-neutral-600 mt-1">
          Banking details for secure settlements
        </div>
      </div>

      {/* Bank Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6">
          {/* Account Holder Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Account Holder Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => onAlphabetInput(e, "accountHolderName")}
                placeholder="As per bank records"
                 maxLength={100}
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              IFSC Code
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleIfscInput}
                placeholder="e.g., SBIN0001234"
                maxLength={11}
                className={`w-full h-12 pl-10 pr-4 rounded-2xl border ${ifscError ? 'border-red-500' : 'border-neutral-500'
                  } focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 uppercase`}
              />
            </div>
            {ifscError && (
              <p className="mt-1 text-sm text-red-500">
                {ifscError}
              </p>
            )}
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => onNumericInput(e, "accountNumber", 18)}
                placeholder="Enter Account number"
                maxLength={18}
                className="w-full h-12 pl-4 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            </div>
          </div>

          {/* Confirm Account Number - No copy-paste allowed */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Confirm Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={onChange}
                placeholder="Re-enter account number"
                maxLength={18}
                onPaste={handleConfirmAccountPaste}
                onCopy={handleConfirmAccountCopy}
                onCut={handleConfirmAccountCut}
                onDragStart={handleConfirmAccountDrag}
                onDrop={handleConfirmAccountDrag}
                className="w-full h-12 pl-4 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            </div>
          </div>

          {/* Bank Name (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <RiBankLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Branch (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Branch
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="branch"
                value={formData.branch}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Bank State (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank State
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2  w-5 h-5" />
              <input
                type="text"
                name="bankState"
                value={formData.bankState}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Bank District (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank District
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="bankDistrict"
                value={formData.bankDistrict}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xl text-black font-semibold mb-2">
            Upload cancelled Cheque / Passbook front page copy
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div
            className="border-2 border-dashed border-primary-50 rounded-2xl p-8 text-center bg-neutral-50 cursor-pointer transition"
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
              {selectedFileName ? (
                <p className="text-label-l3 text-neutral-900 font-medium">
                  {selectedFileName}
                </p>
              ) : (
                <p className="text-label-l3 text-neutral-900">
                  Choose a file or drag & drop it here
                </p>
              )}
              <p className="text-label-l2 text-neutral-400">
                JPEG, PNG, and PDF formats, up to 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button 
          onClick={() => router.push("/")}
          className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
            Cancel
          </button>

          {/* <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
            <Image
              src="/icons/savedrafticon.png"
              alt="Save Draft"
              width={18}
              height={18}
            />
            Save Draft
          </button> */}
        </div>

        <div className="flex gap-4">
          <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={20}
              height={20}
            />
            Back
          </button>

          <button
            onClick={handleContinue}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition"
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