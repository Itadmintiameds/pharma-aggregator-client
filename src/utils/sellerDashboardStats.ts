import type { SellerOrder } from "@/src/types/buyer/order";
import type { ReturnRequest } from "@/src/types/buyer/returns";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import type { SellerCommissionCharge, SellerSettlement } from "@/src/services/seller/sellerBillingService";
import { buildTrend, inWindow, percentChange, resolveRange } from "./dashboardRange";
import type { RangeKey, Trend, TrendPoint } from "./dashboardRange";

// The range helpers live in dashboardRange.ts (shared with the buyer dashboard); re-exported so imports of them
// from here keep working.
export { RANGE_OPTIONS, resolveRange } from "./dashboardRange";
export type { RangeKey, Trend, TrendPoint } from "./dashboardRange";

// Every seller-dashboard number is computed here, from the raw lists, so there is exactly one definition of each
// KPI. It is deliberately free of React and I/O.

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
  const trend = buildTrend(
    billable.map((o) => ({ createdAt: o.createdAt, amount: num(o.grandTotal) })),
    range,
    win.from,
    now
  );

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
