// Helpers for time-limited offers (quantity discounts and buy-X-get-Y schemes).
// The backend evaluates every window in IST and returns startsAt / endsAt (ISO with offset)
// plus an `active` flag; the date/time parts are also returned so the editor can pre-fill.

export type OfferStatus = "Active" | "Scheduled" | "Expired" | "Always on";

export interface OfferWindowLike {
  active?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
  effectiveStartDate?: string | null;
  effectiveEndDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

const toTime = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return isNaN(t) ? null : t;
};

export const getOfferStatus = (o: OfferWindowLike): OfferStatus => {
  const start = toTime(o.startsAt);
  const end = toTime(o.endsAt);
  if (start == null && end == null) {
    // Server gave no instants - fall back to its flag when it is there.
    if (o.active === false) return "Expired";
    return "Always on";
  }
  const now = Date.now();
  if (start != null && now < start) return "Scheduled";
  if (end != null && now >= end) return "Expired";
  return "Active";
};

export const OFFER_STATUS_STYLE: Record<OfferStatus, { bg: string; color: string }> = {
  Active: { bg: "#DCFCE7", color: "#15803D" },
  Scheduled: { bg: "#DBEAFE", color: "#1D4ED8" },
  Expired: { bg: "#FEE2E2", color: "#B91C1C" },
  "Always on": { bg: "#F3F4F6", color: "#4B5563" },
};

const FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
};

/** "01 Dec 2026, 09:00 AM" in IST, or null when there is no bound. */
export const formatOfferInstant = (iso?: string | null): string | null => {
  const t = toTime(iso);
  if (t == null) return null;
  return new Date(t).toLocaleString("en-IN", FORMAT).replace(/\bam\b/, "AM").replace(/\bpm\b/, "PM");
};

/** "Starts … · Ends … (IST)" description of an offer's window. */
export const describeOfferWindow = (o: OfferWindowLike): string => {
  const start = formatOfferInstant(o.startsAt);
  const end = formatOfferInstant(o.endsAt);
  if (!start && !end) return "No time limit";
  const parts: string[] = [];
  parts.push(start ? `Starts ${start}` : "Already started");
  parts.push(end ? `Ends ${end}` : "No end date");
  return `${parts.join(" · ")} (IST)`;
};

/** HH:mm for <input type="time">; backend may send HH:mm:ss. */
export const toTimeInput = (v?: string | null): string => (v ? v.slice(0, 5) : "");

export interface OfferWindowInput {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export const emptyOfferWindow = (): OfferWindowInput => ({
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
});

/** Mirrors the backend's window rules so the seller sees the problem before saving; null = fine. */
export const offerWindowError = (w: OfferWindowInput): string | null => {
  if (w.startTime && !w.startDate) return "A start time needs a start date";
  if (w.endTime && !w.endDate) return "An end time needs an end date";
  if (w.startDate && w.endDate) {
    const start = `${w.startDate}T${w.startTime || "00:00"}`;
    const end = w.endTime ? `${w.endDate}T${w.endTime}` : null;
    // No end time = through the whole end date, i.e. the end date must not be before the start date.
    if (end ? end <= start : w.endDate < w.startDate) return "The end must be after the start";
  }
  return null;
};

/** Window fields in the backend's JSON names; empty values are omitted. */
export const offerWindowPayload = (w: OfferWindowInput) => ({
  effectiveStartDate: w.startDate || undefined,
  effectiveStartTime: w.startTime || undefined,
  effectiveEndDate: w.endDate || undefined,
  effectiveEndTime: w.endTime || undefined,
});

export const offerWindowSummary = (w: OfferWindowInput): string => {
  if (!w.startDate && !w.endDate) return "no time limit";
  const s = w.startDate ? `${w.startDate}${w.startTime ? " " + w.startTime : ""}` : "now";
  const e = w.endDate ? `${w.endDate}${w.endTime ? " " + w.endTime : ""}` : "no end";
  return `${s} → ${e}`;
};
