"use client";

import { useState } from "react";
import { formatOfferInstant, offerStatus, OfferStatus } from "@/src/utils/offers";

interface OfferLike {
  minimumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}

const TONE: Record<OfferStatus, string> = {
  ongoing: "#5A5B58",
  active: "#1E8E3E",
  scheduled: "#B26A00",
  ended: "#C62828",
};

const describe = (offer: OfferLike, status: OfferStatus): string => {
  switch (status) {
    case "active":
      return offer.endsAt ? `Active until ${formatOfferInstant(offer.endsAt)}` : "Active";
    case "scheduled":
      return `Starts ${formatOfferInstant(offer.startsAt)}`;
    case "ended":
      return `Ended ${formatOfferInstant(offer.endsAt)} - buyers no longer see it`;
    default:
      return "Ongoing";
  }
};

/**
 * What the seller needs to know about when a quantity offer is valid: Ongoing, Active until ..., Starts ...
 * or Ended .... (This used to be a fixed "Valid: Ongoing" regardless of the offer's dates.)
 */
export default function OfferValidity({ offers }: { offers: OfferLike[] }) {
  const [now] = useState(() => Date.now());
  if (offers.length === 0) return null;

  const rows = offers.map((offer) => ({ offer, status: offerStatus(offer, now) }));
  if (rows.every((r) => r.status === "ongoing")) {
    return <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">Valid: Ongoing</span>;
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {rows.map(({ offer, status }, i) => (
        <span key={i} className="font-body text-[12px] leading-[18px]" style={{ color: TONE[status] }}>
          {offers.length > 1 && `${offer.additionalDiscountPercentage}% / ${offer.minimumPurchaseQuantity}+ units: `}
          {describe(offer, status)}
        </span>
      ))}
    </div>
  );
}
