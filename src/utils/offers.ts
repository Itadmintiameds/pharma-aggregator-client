// Time-limited quantity offers as the buyer storefront sees them (product-service /products/public/{id}).
// The server already drops expired, not-yet-started and hidden offers, so what arrives is "live at fetch
// time". These helpers keep it right AFTER the fetch: they re-check the window against the SERVER's clock
// (not the browser's, which can be minutes off or in another time zone) so an offer disappears the moment
// it ends and a countdown never lies.

export interface BuyerQuantityOffer {
  minimumPurchaseQuantity: number;
  additionalDiscountPercentage: number;
  // ISO-8601 with offset; null when the offer has no start / no end bound.
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}

/** server clock minus browser clock, in ms. Add it to Date.now() to get "server now". */
export function clockOffsetMs(serverTime?: string | null): number {
  if (!serverTime) return 0;
  const server = Date.parse(serverTime);
  return Number.isNaN(server) ? 0 : server - Date.now();
}

/** True while the offer's window contains `serverNowMs`. Falls back to the server's flag if the bounds are missing. */
export function isOfferLive(
  offer: Pick<BuyerQuantityOffer, "startsAt" | "endsAt" | "active">,
  serverNowMs: number
): boolean {
  const start = offer.startsAt ? Date.parse(offer.startsAt) : null;
  const end = offer.endsAt ? Date.parse(offer.endsAt) : null;
  if (start == null && end == null) return offer.active !== false;
  if (start != null && !Number.isNaN(start) && serverNowMs < start) return false;
  if (end != null && !Number.isNaN(end) && serverNowMs >= end) return false;
  return true;
}

/** The best live offer an order of `quantity` units qualifies for (highest discount), or undefined. */
export function bestOfferForQuantity(
  offers: BuyerQuantityOffer[] | null | undefined,
  quantity: number,
  serverNowMs: number
): BuyerQuantityOffer | undefined {
  return (offers ?? [])
    .filter((o) => isOfferLive(o, serverNowMs) && quantity >= o.minimumPurchaseQuantity)
    .sort((a, b) => b.additionalDiscountPercentage - a.additionalDiscountPercentage)[0];
}

/** "2d 04:12:09", "04:12:09", "12:09". Never negative. */
export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = h > 0 || days > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

export type OfferStatus = "ongoing" | "active" | "scheduled" | "ended";

/**
 * Where an offer is in its life: "ongoing" (no time limit), "active" (inside its window), "scheduled" (starts
 * later) or "ended". Lets the seller screens say why a buyer does or does not see an offer right now.
 */
export function offerStatus(
  offer: Pick<BuyerQuantityOffer, "startsAt" | "endsAt" | "active">,
  nowMs: number
): OfferStatus {
  if (!offer.startsAt && !offer.endsAt) return "ongoing";
  if (isOfferLive(offer, nowMs)) return "active";
  const start = offer.startsAt ? Date.parse(offer.startsAt) : NaN;
  if (!Number.isNaN(start) && nowMs < start) return "scheduled";
  return "ended";
}

/** "05 Nov 2026, 19:08 IST" - an offer instant shown in the zone the server evaluates offers in. */
export function formatOfferInstant(iso?: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return (
    new Date(ms).toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " IST"
  );
}
