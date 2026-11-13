"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaArrowRight, FaTimes } from "react-icons/fa";
import { useConfirmClose } from "@/src/hooks/useConfirmClose";
import ConfirmCloseDialog from "@/src/components/common/ConfirmCloseDialog";

interface BuyerDeclarationProps {
  onAccept: () => void;
  onClose: () => void;
}

// NOTE: draft wording modelled on the seller declarations - have it reviewed by legal before launch.
const DECLARATIONS = [
  {
    title: "Authorized Representation & Legal Binding",
    items: [
      "As a condition of Buyer registration on the TiaMeds Marketplace platform, the following mandatory declarations shall be reviewed and accepted either directly by the Buyer or by an individual duly authorized to act on behalf of the Buyer.",
      "Any acceptance provided through the TiaMeds Marketplace platform shall be deemed to be a legally binding acceptance by the Buyer.",
      "The individual completing the registration confirms that they are authorized to submit information and accept obligations on behalf of the Buyer.",
      "Registration shall not proceed unless the final mandatory acceptance checkbox is acknowledged.",
    ],
  },
  {
    title: "Valid License Confirmation",
    items: [
      "The Buyer confirms that it holds valid, active and applicable licenses and authorizations required under applicable laws to purchase, stock, dispense or use pharmaceutical products.",
      "The Buyer shall keep all such licenses valid throughout its participation on the platform and shall promptly notify TiaMeds of any suspension, cancellation, expiry or regulatory action affecting them.",
      "The Buyer shall purchase only those products that fall within the scope of its licenses.",
    ],
  },
  {
    title: "Regulatory Compliance Commitment",
    items: [
      "The Buyer shall comply with all applicable laws and regulations governing the purchase, storage, sale and use of pharmaceutical products, including but not limited to:",
      "• Drugs and Cosmetics Act, 1940",
      "• Drugs and Cosmetics Rules, 1945",
      "• Medical Devices Rules, 2017",
      "• Applicable CDSCO guidelines and State FDA regulations",
      "The Buyer accepts sole responsibility for regulatory compliance of its own procurement and onward sale or use of products.",
    ],
  },
  {
    title: "Controlled & Prescription Products",
    items: [
      "The Buyer shall purchase and handle Schedule H, H1, X, narcotic, psychotropic and other regulated products strictly in accordance with applicable laws and valid documentation requirements.",
      "The Buyer shall not use the platform to obtain products for unlawful purposes, unauthorized resale or diversion.",
    ],
  },
  {
    title: "Accuracy of Information",
    items: [
      "The Buyer confirms that all information and documents submitted to the platform are accurate, complete, lawful and up to date, and shall be updated promptly when they change.",
      "Any false, misleading or incomplete information may result in rejection, suspension or removal of the Buyer account.",
    ],
  },
  {
    title: "Orders, Payments, Returns & Pharmacovigilance",
    items: [
      "The Buyer shall place orders in good faith, pay for accepted orders in accordance with the agreed commercial terms, and follow the platform's cancellation and return processes.",
      "The Buyer shall inspect products on receipt and promptly report damaged, defective, expired or non-conforming products through the platform.",
      "The Buyer shall comply with applicable adverse event, product complaint and pharmacovigilance reporting requirements.",
    ],
  },
  {
    title: "Storage, Handling & Onward Use",
    items: [
      "The Buyer is responsible for appropriate storage, handling and cold-chain maintenance of products after delivery.",
      "Products purchased through the platform shall be used or sold only for lawful medical, institutional or healthcare purposes.",
    ],
  },
  {
    title: "Data Protection, Privacy & Audit",
    items: [
      "TiaMeds Marketplace shall maintain reasonable technical and organizational safeguards to protect Buyer data in accordance with applicable laws, including the Digital Personal Data Protection (DPDP) Act, 2023.",
      "TiaMeds Marketplace maintains transaction logs and audit trails, and may conduct verification reviews or compliance checks relating to Buyers.",
      "Buyer information may be disclosed to regulators, courts or government authorities whenever legally required.",
    ],
  },
  {
    title: "TiaMeds Marketplace Platform Role & Nature",
    items: [
      "TiaMeds Marketplace operates as a technology-enabled procurement and transaction facilitation platform connecting authorized buyers and sellers. It is a neutral intermediary and does not manufacture, prescribe, recommend or endorse pharmaceutical products.",
      "TiaMeds Marketplace may suspend accounts, block transactions, request additional documentation or support regulatory authorities whenever required for compliance, fraud prevention or legal obligations.",
    ],
  },
  {
    title: "Indemnity & Limitation of Liability",
    items: [
      "The Buyer agrees to indemnify and hold harmless TiaMeds Marketplace against claims, losses, penalties or regulatory consequences arising from the Buyer's activities, regulatory non-compliance, misrepresentation or unlawful use of products.",
      "TiaMeds Marketplace shall not be liable for obligations or violations arising from the actions or omissions of Buyers or Sellers.",
    ],
  },
];

export default function BuyerDeclaration({ onAccept, onClose }: BuyerDeclarationProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [hasSeenBottom, setHasSeenBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isConfirmOpen, requestClose, confirmClose, cancelClose } = useConfirmClose(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 10) setHasSeenBottom(true);
  };

  const ready = isAccepted && hasSeenBottom;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur" onClick={requestClose} />

      <ConfirmCloseDialog isOpen={isConfirmOpen} onConfirm={confirmClose} onCancel={cancelClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buyer declarations"
        className="relative mx-2 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:h-[85vh] sm:rounded-2xl"
      >
        <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white p-2">
          <div className="flex items-center justify-between">
            <div className="relative h-10 w-32 md:h-12 md:w-40">
              <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" fill className="object-contain" priority />
            </div>
            <button onClick={requestClose} aria-label="Close" className="rounded-full p-2 transition-colors hover:bg-neutral-100">
              <FaTimes className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
          <h1 className="text-center text-base font-bold text-neutral-900 sm:text-lg">
            Buyer Pre-Registration Mandatory Declarations &amp; Acceptance
          </h1>
        </div>

        <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-6">
            {DECLARATIONS.map((declaration, index) => (
              <div key={declaration.title} className="border-l-2 border-primary-200 pl-4">
                <h2 className="mb-2 text-base font-bold text-neutral-900">
                  {index + 1}. {declaration.title}
                </h2>
                <ul className="space-y-2">
                  {declaration.items.map((item) =>
                    item.startsWith("•") ? (
                      <li key={item} className="ml-4 text-sm text-neutral-700">
                        {item}
                      </li>
                    ) : (
                      <li key={item} className="flex items-start text-sm text-neutral-900">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-start">
            <input
              type="checkbox"
              id="buyer-declaration-acceptance"
              checked={isAccepted}
              onChange={(e) => hasSeenBottom && setIsAccepted(e.target.checked)}
              disabled={!hasSeenBottom}
              className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label
              htmlFor="buyer-declaration-acceptance"
              className={`ml-3 text-sm ${hasSeenBottom ? "text-neutral-900" : "text-neutral-400"}`}
            >
              I hereby confirm that I have read, understood, acknowledged and accepted all the above declarations,
              obligations, compliance requirements and marketplace governance policies applicable to participation on
              the TiaMeds Marketplace platform. I further understand that any non-compliance may result in suspension,
              regulatory reporting, investigation, restriction of platform access, or permanent removal from the
              platform.
            </label>
          </div>

          {!hasSeenBottom && (
            <p className="mb-3 text-xs text-warning-600">
              Please scroll to the bottom of all declarations before you can accept them
            </p>
          )}

          <button
            onClick={() => ready && onAccept()}
            disabled={!ready}
            className={`flex w-full items-center justify-center rounded-xl px-8 py-3 text-base font-bold transition-all ${
              ready
                ? "bg-primary-600 text-white shadow-lg hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-xl"
                : "cursor-not-allowed bg-neutral-200 text-neutral-500"
            }`}
          >
            {ready ? (
              <>
                Click here to continue to registration page <FaArrowRight className="ml-3 h-4 w-4" />
              </>
            ) : hasSeenBottom ? (
              "Please accept the declarations to continue"
            ) : (
              "Scroll to bottom to enable acceptance"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
