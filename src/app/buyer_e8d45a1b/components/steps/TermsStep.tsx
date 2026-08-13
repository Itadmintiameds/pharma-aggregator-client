"use client";

import React from "react";
import Image from "next/image";

interface Props {
  acceptedTerms: boolean;
  error?: string;
  onChange: (accepted: boolean) => void;
  nextStep: () => void;
  onExitToIntro?: () => void;
}

export default function TermsStep({ acceptedTerms, error, onChange, nextStep, onExitToIntro }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Terms &amp; Conditions
        </h1>
        <p className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Please review and accept our terms before starting your buyer registration.
        </p>
      </div>

      <div className="border border-neutral-200 rounded-xl p-5 bg-white max-h-[50vh] overflow-y-auto">
        <p className="text-p3 font-body font-regular text-pneutral-700 leading-[24px]">
          By registering as a buyer on TiaMeds, you agree to provide accurate organization,
          contact and compliance-document information, to keep your account details up to
          date, and to comply with all applicable pharmaceutical procurement regulations.
          TiaMeds reserves the right to verify submitted documents and to approve, reject, or
          request corrections to your registration at its sole discretion.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-neutral-400 accent-primary-800"
          />
          <span className="text-p3 font-body font-regular text-pneutral-900">
            I have read and agree to the Terms &amp; Conditions and Privacy Policy.
          </span>
        </label>
        {error && <p className="text-p2 font-body font-regular text-red-500 mt-1">{error}</p>}
      </div>

      <div className="flex justify-between mt-4">
        {onExitToIntro ? (
          <button
            onClick={onExitToIntro}
            className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={nextStep}
          className="h-12 px-6 border-2 border-primary-800 text-primary-800 rounded-xl flex items-center gap-2"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
