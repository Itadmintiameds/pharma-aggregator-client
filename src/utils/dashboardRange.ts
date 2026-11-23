// Date-range and trend-chart helpers shared by the seller and buyer dashboards, so "last 30 days", "vs the previous
// period" and the sales/spend-over-time buckets mean exactly the same on both. Pure: no React, no I/O.

export type RangeKey = "today" | "7d" | "30d" | "90d" | "all";

export const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

export interface Trend {
  /** Percent change against the previous period of the same length; null when there is nothing to compare. */
  percent: number | null;
}

export interface TrendPoint {
  label: string;
  /** Sort key (start of the bucket). */
  at: number;
  /** Money in this bucket (sales for a seller, spend for a buyer). */
  sales: number;
  orders: number;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** [from, to) of the selected range, and of the period right before it. `from` is null for "all time". */
export function resolveRange(range: RangeKey, now: Date) {
  const days = RANGE_OPTIONS.find((o) => o.key === range)?.days ?? null;
  if (days === null) return { from: null as number | null, to: now.getTime() + 1, prevFrom: null, prevTo: null };
  const today = startOfDay(now).getTime();
  const from = today - (days - 1) * 86_400_000;
  const to = today + 86_400_000;
  return { from, to, prevFrom: from - days * 86_400_000, prevTo: from } as {
    from: number;
    to: number;
    prevFrom: number;
    prevTo: number;
  };
}

export function inWindow(value: string | undefined | null, from: number | null, to: number): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return (from === null || time >= from) && time < to;
}

export function percentChange(current: number, previous: number | null): Trend {
  if (previous === null || previous <= 0) return { percent: null };
  return { percent: ((current - previous) / previous) * 100 };
}

type Bucket = "day" | "week" | "month";

function bucketFor(range: RangeKey, from: number | null, firstAt: number | null, now: Date): Bucket {
  const spanDays = from === null ? (firstAt === null ? 0 : (now.getTime() - firstAt) / 86_400_000) : null;
  const days = RANGE_OPTIONS.find((o) => o.key === range)?.days;
  if (days != null && days <= 31) return "day";
  if (days != null && days <= 100) return "week";
  return spanDays !== null && spanDays <= 62 ? "day" : spanDays !== null && spanDays <= 200 ? "week" : "month";
}

function bucketStart(time: number, bucket: Bucket): Date {
  const d = startOfDay(new Date(time));
  if (bucket === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  if (bucket === "month") d.setDate(1);
  return d;
}

function bucketLabel(date: Date, bucket: Bucket): string {
  if (bucket === "month") return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function nextBucket(date: Date, bucket: Bucket): Date {
  const d = new Date(date);
  if (bucket === "day") d.setDate(d.getDate() + 1);
  else if (bucket === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Groups rows (a created time and an amount) into day / week / month buckets that suit the range, and fills the
 * gaps so a quiet day shows as zero instead of being skipped.
 */
export function buildTrend(
  rows: { createdAt?: string | null; amount: number }[],
  range: RangeKey,
  from: number | null,
  now: Date
): TrendPoint[] {
  const times = rows
    .map((r) => (r.createdAt ? new Date(r.createdAt).getTime() : Number.NaN))
    .filter((t) => Number.isFinite(t));
  const firstAt = times.length ? Math.min(...times) : null;
  const bucket = bucketFor(range, from, firstAt, now);

  const points = new Map<number, TrendPoint>();
  rows.forEach((row) => {
    if (!row.createdAt) return;
    const start = bucketStart(new Date(row.createdAt).getTime(), bucket);
    const point = points.get(start.getTime()) ?? { label: bucketLabel(start, bucket), at: start.getTime(), sales: 0, orders: 0 };
    point.sales += row.amount;
    point.orders += 1;
    points.set(start.getTime(), point);
  });

  const first = from !== null ? bucketStart(from, bucket) : firstAt !== null ? bucketStart(firstAt, bucket) : null;
  if (first) {
    const end = bucketStart(now.getTime(), bucket);
    for (let d = first, guard = 0; d.getTime() <= end.getTime() && guard < 400; d = nextBucket(d, bucket), guard++) {
      if (!points.has(d.getTime())) points.set(d.getTime(), { label: bucketLabel(d, bucket), at: d.getTime(), sales: 0, orders: 0 });
    }
  }
  return [...points.values()].sort((a, b) => a.at - b.at);
}
