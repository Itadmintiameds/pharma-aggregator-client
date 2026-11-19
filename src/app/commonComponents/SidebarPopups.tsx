"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Copy, Gift, Headset, Mail, X, ExternalLink } from "lucide-react";

// Frontend-only popups for the cards at the bottom of the seller and buyer sidebars. The support addresses are the ones
// already published on the landing page (FAQ, footer and /contact); the gift copy is deliberately generic -
// change GIFT_MESSAGE when there is a real offer to announce.
const SELLER_SUPPORT_EMAIL = "seller-support@tiameds.ai";
const BUYER_SUPPORT_EMAIL = "buyer-support@tiameds.ai";
const GENERAL_SUPPORT_EMAIL = "support@tiameds.ai";
const GIFT_MESSAGE =
  "Something special is on its way for TiaMeds sellers. We'll let you know here and by email as soon as your gift is ready to claim.";

function Popup({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // move focus into the dialog so keyboard users start inside it (Tab then reaches its links and buttons)
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portalled to <body>: the sidebar is its own stacking context, so the popup would otherwise sit under the header.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        // max-w-[28rem], not max-w-md: this project's theme defines --spacing-md as 16px, which Tailwind v4 uses for max-w-md.
        className="w-full max-w-[26rem] rounded-xl bg-white p-5 shadow-xl outline-none"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-800">
              {icon}
            </span>
            <h2 className="text-base leading-6 font-heading font-bold text-neutral-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-800"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ContactRow({ label, email }: { label: string; email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure context): the mailto link still works */
    }
  };
  return (
    <div className="flex items-center gap-1 rounded-lg border border-neutral-200 pr-1.5 hover:bg-neutral-50">
      <a href={`mailto:${email}`} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2">
        <Mail size={16} className="shrink-0 text-primary-800" />
        <span className="min-w-0">
          <span className="block text-[11px] leading-4 text-neutral-500">{label}</span>
          <span className="block truncate text-[13px] font-body font-semibold text-neutral-900">{email}</span>
        </span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${email}`}
        title={copied ? "Copied" : "Copy email"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-primary-800 focus-visible:outline-2 focus-visible:outline-primary-800"
      >
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function HelpSupportPopup({
  onClose,
  audience = "seller",
}: {
  onClose: () => void;
  audience?: "seller" | "buyer";
}) {
  const isBuyer = audience === "buyer";
  return (
    <Popup title="Help & Support" icon={<Headset size={18} />} onClose={onClose}>
      <p className="mb-3 text-[13px] leading-5 font-body text-neutral-600">
        {isBuyer
          ? "Questions about products, orders, returns or quotes? Our buyer support team is happy to help."
          : "Questions about products, orders, returns or payouts? Our seller support team is happy to help."}
      </p>
      <div className="flex flex-col gap-2">
        <ContactRow
          label={isBuyer ? "Buyer support" : "Seller support"}
          email={isBuyer ? BUYER_SUPPORT_EMAIL : SELLER_SUPPORT_EMAIL}
        />
        <ContactRow label="General support" email={GENERAL_SUPPORT_EMAIL} />
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Tip: include your order or product ID in your email so we can help faster.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href="/contact"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-800 hover:underline"
        >
          More ways to reach us <ExternalLink size={14} />
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg border-[1.5px] border-primary-900 px-4 py-1.5 text-[13px] font-semibold text-primary-900 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
        >
          Close
        </button>
      </div>
    </Popup>
  );
}

export function GiftPopup({ onClose }: { onClose: () => void }) {
  return (
    <Popup title="Free gift awaits you!" icon={<Gift size={18} />} onClose={onClose}>
      <p className="text-[13px] leading-5 font-body text-neutral-600">{GIFT_MESSAGE}</p>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border-[1.5px] border-primary-900 px-4 py-1.5 text-[13px] font-semibold text-primary-900 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
        >
          Got it
        </button>
      </div>
    </Popup>
  );
}
