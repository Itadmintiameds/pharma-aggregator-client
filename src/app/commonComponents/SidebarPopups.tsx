"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Gift, Headset, Mail, X, ExternalLink } from "lucide-react";

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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
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
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        // max-w-[28rem], not max-w-md: this project's theme defines --spacing-md as 16px, which Tailwind v4 uses for max-w-md.
        className="w-full max-w-[28rem] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-800">
              {icon}
            </span>
            <h2 className="text-p1 font-heading font-semibold text-neutral-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ContactRow({ label, email }: { label: string; email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
    >
      <Mail size={18} className="shrink-0 text-primary-800" />
      <span className="min-w-0">
        <span className="block text-xs text-neutral-500">{label}</span>
        <span className="block truncate text-p4 font-body font-medium text-neutral-900">{email}</span>
      </span>
    </a>
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
    <Popup title="Help & Support" icon={<Headset size={20} />} onClose={onClose}>
      <p className="mb-4 text-p4 font-body text-neutral-600">
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
      <p className="mt-4 text-xs text-neutral-500">
        Tip: include your order or product ID in your email so we can help faster.
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href="/contact"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-p4 font-semibold text-primary-800 hover:underline"
        >
          More ways to reach us <ExternalLink size={14} />
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    </Popup>
  );
}

export function GiftPopup({ onClose }: { onClose: () => void }) {
  return (
    <Popup title="Free gift awaits you!" icon={<Gift size={20} />} onClose={onClose}>
      <p className="text-p4 font-body text-neutral-600">{GIFT_MESSAGE}</p>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    </Popup>
  );
}
