"use client";

import { formatCountdown } from "@/src/utils/offers";

interface OfferCountdownProps {
  endsAt: string;
  // "Now" on the server's clock (from useServerNow), so every countdown on a page ticks together.
  serverNowMs: number;
  className?: string;
}

/** "Ends in 2d 04:12:09" until the offer ends, then "Offer ended". */
export default function OfferCountdown({ endsAt, serverNowMs, className }: OfferCountdownProps) {
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return null;

  const remaining = end - serverNowMs;
  if (remaining <= 0) {
    return <span className={className}>Offer ended</span>;
  }
  // Under an hour left is worth flagging.
  const urgent = remaining < 60 * 60 * 1000;
  return (
    <span className={className} style={urgent ? { color: "#DC2626", fontWeight: 600 } : undefined}>
      Ends in <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCountdown(remaining)}</span>
    </span>
  );
}
