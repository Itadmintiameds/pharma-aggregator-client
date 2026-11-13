import type { SellerOrder } from "@/src/types/buyer/order";
import type { ReturnRequest } from "@/src/types/buyer/returns";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import type { SellerCommissionCharge, SellerSettlement } from "@/src/services/seller/sellerBillingService";

// Every seller-dashboard number is computed here, from the raw lists, so there is exactly one definition of each
// KPI. It is deliberately free of React and I/O.

export type RangeKey = "today" | "7d" | "30d" | "90d" | "all";

export const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

// An order that has been delivered, including the ones that were returned or refunded afterwards (the sale
// happened; the return is accounted for separately, in `refunds`).
const COMPLETED_STATUSES = new Set([
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
  "REFUNDED",
]);
const TO_SHIP_STATUSES = new Set(["CONFIRMED", "PACKED"]);
const IN_TRANSIT_STATUSES = new Set(["SHIPPED", "OUT_FOR_DELIVERY"]);

/** A PLACED order waiting longer than this is flagged (same SLA the Orders page uses). */
export const PLACED_SLA_HOURS = 24;
/** At or below this many units a published product counts as low on stock. */
export const LOW_STOCK_THRESHOLD = 10;
/** Batches expiring within this many days are flagged. */
export const EXPIRY_WARNING_DAYS = 60;

export interface ProductBatch {
  stockQuantity?: number | null;
  expiryDate?: string | null;
}

export interface SellerProduct {
  productId: string;
  productName?: string;
  /** PUBLISHED | DRAFT | UNPUBLISHED */
  status?: string;
  pricingDetails?: ProductBatch[] | null;
}

export interface DashboardInput {
  orders: SellerOrder[];
  returns: ReturnRequest[];
  quotes: QuoteRequest[];
  products: SellerProduct[];
  settlements: SellerSettlement[];
  commissions: SellerCommissionCharge[];
  range: RangeKey;
  now?: Date;
}

export interface Trend {
  /** Percent change against the previous period of the same length; null when there is nothing to compare. */
  percent: number | null;
}

export interface TrendPoint {
  label: string;
  /** Sort key (start of the bucket). */
  at: number;
  sales: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}

export interface StockAlert {
  productId: string;
  name: string;
  stock: number;
}

export interface DashboardStats {
  attention: {
    toConfirm: number;
    /** PLACED orders older than the SLA. */
    overdue: number;
    toShip: number;
    inTransit: number;
    returnsToDecide: number;
    returnsToInspect: number;
    quotesToReply: number;
  };
  sales: {
    ordersReceived: number;
    ordersReceivedTrend: Trend;
    grossSales: number;
    grossSalesTrend: Trend;
    netSales: number;
    netSalesTrend: Trend;
    refunds: number;
    averageOrderValue: number | null;
    commission: number;
    gstOnCommission: number;
    /** Approved settlements not yet paid out (all time). */
    pendingPayout: number;
    /** Settlements already paid out (all time). */
    paidOut: number;
    lastPayout: { amount: number; date?: string } | null;
  };
  performance: {
    delivered: number;
    cancelled: number;
    cancelledBySeller: number;
    cancelledByBuyer: number;
    /** completed / (completed + cancelled); null when no order has finished yet. */
    fulfilmentRate: number | null;
    cancellationRate: number | null;
    /** Share of delivered orders (in the period) that had at least one return - never above 100%. */
    returnRate: number | null;
    returnCount: number;
    returnedOrders: number;
    topReturnReason: string | null;
    /** Mean hours from order placed to confirmed. */
    avgConfirmHours: number | null;
    quoteConversion: number | null;
    quotesAnswered: number;
    quotesWon: number;
  };
  inventory: {
    published: number;
    drafts: number;
    outOfStock: number;
    lowStock: number;
    expiringBatches: number;
    alerts: StockAlert[];
  };
  trend: TrendPoint[];
  statusBreakdown: { status: string; count: number }[];
  topProducts: TopProduct[];
}

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function startOfDay(date: Date): Date {
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

function inWindow(value: string | undefined | null, from: number | null, to: number): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return (from === null || time >= from) && time < to;
}

function percentChange(current: number, previous: number | null): Trend {
  if (previous === null || previous <= 0) return { percent: null };
  return { percent: ((current - previous) / previous) * 100 };
}

const grossOf = (orders: SellerOrder[]) =>
  orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + num(o.grandTotal), 0);
const completedValueOf = (orders: SellerOrder[]) =>
  orders.filter((o) => COMPLETED_STATUSES.has(o.status)).reduce((sum, o) => sum + num(o.grandTotal), 0);

/** Money that actually went back to buyers: the refund of every return that was inspected and refunded. */
function refundsOf(returns: ReturnRequest[]): number {
  return returns
    .filter((r) => r.status === "RECEIVED" || r.status === "REFUNDED")
    .reduce((sum, r) => sum + num(r.refundAmount), 0);
}

function bucketFor(range: RangeKey, from: number | null, firstOrderAt: number | null) {
  const spanDays = from === null ? (firstOrderAt === null ? 0 : (Date.now() - firstOrderAt) / 86_400_000) : null;
  const days = RANGE_OPTIONS.find((o) => o.key === range)?.days;
  if (days != null && days <= 31) return "day" as const;
  if (days != null && days <= 100) return "week" as const;
  return spanDays !== null && spanDays <= 62 ? ("day" as const) : spanDays !== null && spanDays <= 200 ? ("week" as const) : ("month" as const);
}

function bucketStart(time: number, bucket: "day" | "week" | "month"): Date {
  const d = startOfDay(new Date(time));
  if (bucket === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  if (bucket === "month") d.setDate(1);
  return d;
}

function bucketLabel(date: Date, bucket: "day" | "week" | "month"): string {
  if (bucket === "month") return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function nextBucket(date: Date, bucket: "day" | "week" | "month"): Date {
  const d = new Date(date);
  if (bucket === "day") d.setDate(d.getDate() + 1);
  else if (bucket === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function computeDashboardStats(input: DashboardInput): DashboardStats {
  const now = input.now ?? new Date();
  const { orders, returns, quotes, products, settlements, commissions, range } = input;
  const win = resolveRange(range, now);

  const ordersIn = orders.filter((o) => inWindow(o.createdAt, win.from, win.to));
  const ordersPrev =
    win.prevFrom === null ? null : orders.filter((o) => inWindow(o.createdAt, win.prevFrom, win.prevTo as number));
  const returnsIn = returns.filter((r) => inWindow(r.requestedAt, win.from, win.to));
  const returnsPrev =
    win.prevFrom === null ? null : returns.filter((r) => inWindow(r.requestedAt, win.prevFrom, win.prevTo as number));
  const quotesIn = quotes.filter((q) => inWindow(q.createdAt, win.from, win.to));

  // ---- needs your attention (live: not affected by the date range) ----
  const placed = orders.filter((o) => o.status === "PLACED");
  const overdue = placed.filter((o) => {
    const placedAt = o.statusHistory?.find((h) => h.toStatus === "PLACED")?.changedAt ?? o.createdAt;
    return placedAt ? (now.getTime() - new Date(placedAt).getTime()) / 3_600_000 > PLACED_SLA_HOURS : false;
  }).length;
  const attention = {
    toConfirm: placed.length,
    overdue,
    toShip: orders.filter((o) => TO_SHIP_STATUSES.has(o.status)).length,
    inTransit: orders.filter((o) => IN_TRANSIT_STATUSES.has(o.status)).length,
    returnsToDecide: returns.filter((r) => r.status === "REQUESTED").length,
    returnsToInspect: returns.filter((r) => r.status === "SHIPPED" || r.status === "OUT_FOR_DELIVERY").length,
    quotesToReply: quotes.filter((q) => q.status === "PENDING").length,
  };

  // ---- sales & earnings ----
  const grossSales = grossOf(ordersIn);
  const refunds = refundsOf(returnsIn);
  const netSales = completedValueOf(ordersIn) - refunds;
  const netSalesPrev =
    ordersPrev === null || returnsPrev === null ? null : completedValueOf(ordersPrev) - refundsOf(returnsPrev);
  const billable = ordersIn.filter((o) => o.status !== "CANCELLED");

  const chargesIn = commissions.filter((c) => inWindow(c.accruedAt, win.from, win.to));
  const paid = settlements.filter((s) => s.status === "PAID");
  const lastPaid = [...paid].sort((a, b) => (b.periodTo ?? "").localeCompare(a.periodTo ?? ""))[0];

  const sales = {
    ordersReceived: ordersIn.length,
    ordersReceivedTrend: percentChange(ordersIn.length, ordersPrev?.length ?? null),
    grossSales,
    grossSalesTrend: percentChange(grossSales, ordersPrev === null ? null : grossOf(ordersPrev)),
    netSales,
    netSalesTrend: percentChange(netSales, netSalesPrev),
    refunds,
    averageOrderValue: billable.length > 0 ? grossSales / billable.length : null,
    commission: chargesIn.reduce((sum, c) => sum + num(c.commissionAmount), 0),
    gstOnCommission: chargesIn.reduce((sum, c) => sum + num(c.gstOnCommission), 0),
    pendingPayout: settlements
      .filter((s) => s.status === "APPROVED")
      .reduce((sum, s) => sum + Math.max(num(s.netPayable), 0), 0),
    paidOut: paid.reduce((sum, s) => sum + Math.max(num(s.netPayable), 0), 0),
    lastPayout: lastPaid ? { amount: num(lastPaid.netPayable), date: lastPaid.periodTo } : null,
  };

  // ---- performance ----
  const completed = ordersIn.filter((o) => COMPLETED_STATUSES.has(o.status));
  const cancelled = ordersIn.filter((o) => o.status === "CANCELLED");
  const finished = completed.length + cancelled.length;
  const confirmDurations = ordersIn
    .filter((o) => o.confirmedAt && o.createdAt)
    .map((o) => (new Date(o.confirmedAt as string).getTime() - new Date(o.createdAt as string).getTime()) / 3_600_000)
    .filter((h) => Number.isFinite(h) && h >= 0);

  // Cohort of the delivered orders in this period: how many of them came back. Counting orders (not return
  // requests) keeps the rate meaningful when one order is returned in several parts.
  const returnedOrderIds = new Set(
    returns.filter((r) => r.status !== "CANCELLED" && r.sellerOrderId).map((r) => r.sellerOrderId as string)
  );
  const returnedOrders = completed.filter((o) => returnedOrderIds.has(o.sellerOrderId)).length;

  const reasonCounts = new Map<string, number>();
  returnsIn.forEach((r) => {
    if (r.reasonCode) reasonCounts.set(r.reasonCode, (reasonCounts.get(r.reasonCode) ?? 0) + 1);
  });
  const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const answered = quotesIn.filter((q) => q.status !== "PENDING");
  const won = quotesIn.filter((q) => q.status === "ACCEPTED" || q.status === "ORDER_PLACED");

  const performance = {
    delivered: completed.length,
    cancelled: cancelled.length,
    cancelledBySeller: cancelled.filter((o) => o.cancelledByRole?.toUpperCase() === "SELLER").length,
    cancelledByBuyer: cancelled.filter((o) => o.cancelledByRole?.toUpperCase() === "BUYER").length,
    fulfilmentRate: finished > 0 ? (completed.length / finished) * 100 : null,
    cancellationRate: ordersIn.length > 0 ? (cancelled.length / ordersIn.length) * 100 : null,
    returnRate: completed.length > 0 ? (returnedOrders / completed.length) * 100 : null,
    returnCount: returnsIn.length,
    returnedOrders,
    topReturnReason: topReason ? topReason[0] : null,
    avgConfirmHours:
      confirmDurations.length > 0 ? confirmDurations.reduce((a, b) => a + b, 0) / confirmDurations.length : null,
    quoteConversion: answered.length > 0 ? (won.length / answered.length) * 100 : null,
    quotesAnswered: answered.length,
    quotesWon: won.length,
  };

  // ---- inventory (live) ----
  const expiryLimit = now.getTime() + EXPIRY_WARNING_DAYS * 86_400_000;
  const published = products.filter((p) => p.status === "PUBLISHED");
  let outOfStock = 0;
  let lowStock = 0;
  let expiringBatches = 0;
  const alerts: StockAlert[] = [];
  published.forEach((p) => {
    const batches = p.pricingDetails ?? [];
    if (batches.length === 0) return; // no stock set up yet - nothing to alert on
    const stock = batches.reduce((sum, b) => sum + num(b.stockQuantity), 0);
    if (stock <= 0) outOfStock++;
    else if (stock <= LOW_STOCK_THRESHOLD) lowStock++;
    if (stock <= LOW_STOCK_THRESHOLD) alerts.push({ productId: p.productId, name: p.productName ?? p.productId, stock });
    expiringBatches += batches.filter((b) => {
      if (num(b.stockQuantity) <= 0 || !b.expiryDate) return false;
      const t = new Date(b.expiryDate).getTime();
      return !Number.isNaN(t) && t <= expiryLimit;
    }).length;
  });
  alerts.sort((a, b) => a.stock - b.stock);

  // ---- charts / lists ----
  const firstOrderAt = ordersIn.length
    ? Math.min(...ordersIn.map((o) => new Date(o.createdAt ?? now).getTime()))
    : null;
  const bucket = bucketFor(range, win.from, firstOrderAt);
  const points = new Map<number, TrendPoint>();
  billable.forEach((o) => {
    if (!o.createdAt) return;
    const start = bucketStart(new Date(o.createdAt).getTime(), bucket);
    const point = points.get(start.getTime()) ?? { label: bucketLabel(start, bucket), at: start.getTime(), sales: 0, orders: 0 };
    point.sales += num(o.grandTotal);
    point.orders += 1;
    points.set(start.getTime(), point);
  });
  // Fill the gaps so a quiet day shows as zero instead of being skipped.
  const first = win.from !== null ? bucketStart(win.from, bucket) : firstOrderAt !== null ? bucketStart(firstOrderAt, bucket) : null;
  if (first) {
    const end = bucketStart(now.getTime(), bucket);
    for (let d = first, guard = 0; d.getTime() <= end.getTime() && guard < 400; d = nextBucket(d, bucket), guard++) {
      if (!points.has(d.getTime())) points.set(d.getTime(), { label: bucketLabel(d, bucket), at: d.getTime(), sales: 0, orders: 0 });
    }
  }
  const trend = [...points.values()].sort((a, b) => a.at - b.at);

  const statusCounts = new Map<string, number>();
  ordersIn.forEach((o) => statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1));
  const statusBreakdown = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const byProduct = new Map<string, TopProduct>();
  billable.forEach((o) =>
    o.items?.forEach((item) => {
      const key = item.productId ?? item.productNameSnapshot ?? "unknown";
      const row = byProduct.get(key) ?? { productId: item.productId ?? key, name: item.productNameSnapshot ?? key, units: 0, revenue: 0 };
      row.units += num(item.quantity);
      row.revenue += num(item.lineTotal);
      byProduct.set(key, row);
    })
  );
  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return {
    attention,
    sales,
    performance,
    inventory: {
      published: published.length,
      drafts: products.filter((p) => p.status === "DRAFT").length,
      outOfStock,
      lowStock,
      expiringBatches,
      alerts: alerts.slice(0, 6),
    },
    trend,
    statusBreakdown,
    topProducts,
  };
}
