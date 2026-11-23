"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { getLegalContent } from "@/src/services/content/ContentService";

interface Props {
  acceptedTerms: boolean;
  error?: string;
  onChange: (accepted: boolean) => void;
  nextStep?: () => void;
  onExitToIntro?: () => void;
  // Renders as a sub-block with no heading/nav buttons of its own — used
  // when composed inside another step (see OrgDetailsForm.tsx, which now
  // shares step 1 with this component and owns the Continue/Back row).
  hideFooter?: boolean;
}

const FALLBACK_TERMS_HTML = `<p>By registering as a buyer on TiaMeds, you agree to provide accurate organization,
  contact and compliance-document information, to keep your account details up to
  date, and to comply with all applicable pharmaceutical procurement regulations.
  TiaMeds reserves the right to verify submitted documents and to approve, reject, or
  request corrections to your registration at its sole discretion.</p>`;

export default function TermsStep({ acceptedTerms, error, onChange, nextStep, onExitToIntro, hideFooter = false }: Props) {
  const [termsHtml, setTermsHtml] = useState<string>(FALLBACK_TERMS_HTML);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getLegalContent("BUYER_TERMS")
      .then((content) => {
        if (!cancelled && content?.content) {
          setTermsHtml(DOMPurify.sanitize(content.content));
        }
      })
      .catch(() => {
        // Keep the fallback text already in state; registration must not be blocked
        // by the terms content being unreachable.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {!hideFooter && (
        <div>
          <h1 className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
            Terms &amp; Conditions
          </h1>
          <p className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
            Please review and accept our terms before starting your buyer registration.
          </p>
        </div>
      )}

      {hideFooter && (
        <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900">Terms &amp; Conditions</h3>
      )}

      <div className="border border-neutral-200 rounded-xl p-5 bg-white max-h-[30vh] overflow-y-auto">
        {loading ? (
          <p className="text-p3 font-body font-regular text-pneutral-500 leading-[24px]">Loading terms…</p>
        ) : (
          <div
            className="text-p3 font-body font-regular text-pneutral-700 leading-[24px] [&_h2]:font-heading [&_h2]:font-medium [&_h2]:text-pneutral-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        )}
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

      {!hideFooter && (
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
            className="h-12 px-6 rounded-xl bg-primary-800 text-white flex items-center gap-2 font-semibold"
          >
            Continue
            <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} className="brightness-0 invert" />
          </button>
        </div>
      )}
    </div>
  );
}
