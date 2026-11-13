import type { Order } from "@/src/types/buyer/order";
import type { ReturnRequest } from "@/src/types/buyer/returns";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { buildTrend, inWindow, percentChange, resolveRange } from "./dashboardRange";
import type { RangeKey, Trend, TrendPoint } from "./dashboardRange";

// Every buyer-dashboard number is computed here, from the raw lists, so there is exactly one definition of each
// KPI. Free of React and I/O (the same approach as sellerDashboardStats.ts).

/** A quote or accepted quote that runs out within this many days is flagged. */
export const QUOTE_EXPIRY_WARNING_DAYS = 2;

export interface BuyerTopProduct {
  productId: string;
  name: string;
  units: number;
  /** Amount spent on it (order line totals). */
  revenue: number;
}

export interface BuyerDashboardInput {
  orders: Order[];
  returns: ReturnRequest[];
  quotes: QuoteRequest[];
  /** productId -> the product's current listed unit price; used only to estimate savings on quotation orders. */
  listedPrices?: Record<string, number>;
  range: RangeKey;
  now?: Date;
}

export interface BuyerDashboardStats {
  attention: {
    /** Quotes a seller has sent and the buyer has not answered yet (still valid). */
    quotesToReview: number;
    /** Of the quotes to review and accepted ones, how many run out within QUOTE_EXPIRY_WARNING_DAYS. */
    quotesExpiringSoon: number;
    /** Accepted quotes that can still be turned into an order. */
    acceptedToOrder: number;
    /** Accepted quotes whose validity has passed - a new quote is needed. */
    acceptedExpired: number;
    ordersInProgress: number;
    /** Seller orders that are out for delivery right now (the buyer has to share the delivery OTP). */
    outForDelivery: number;
    returnsToShip: number;
    returnsToMarkOutForDelivery: number;
    refundsOnTheWay: { amount: number; count: number };
  };
  spend: {
    ordersPlaced: number;
    ordersPlacedTrend: Trend;
    totalSpend: number;
    totalSpendTrend: Trend;
    refunds: number;
    /** Total spend minus refunds received, never below zero. */
    netSpend: number;
    netSpendTrend: Trend;
    averageOrderValue: number | null;
    quoteOrders: number;
    quoteOrdersValue: number;
    /** Estimated saving on quotation orders against the product's current listed price; null when unknown. */
    quoteSavings: number | null;
  };
  performance: {
    delivered: number;
    cancelled: number;
    cancelledByYou: number;
    cancelledBySeller: number;
    cancellationRate: number | null;
    /** Delivered orders (in the period) that had at least one return, as a share of delivered orders. */
    returnRate: number | null;
    returnedOrders: number;
    /** Mean days from order placed to delivered. */
    avgDeliveryDays: number | null;
    quotesRaised: number;
    quotesAnswered: number;
    quotesWon: number;
    quoteWinRate: number | null;
  };
  trend: TrendPoint[];
  statusBreakdown: { status: string; count: number }[];
  topProducts: BuyerTopProduct[];
  recentOrders: Order[];
}

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const orderDate = (o: Order) => o.placedAt ?? o.createdAt;

/** quoteValidUntil is a plain "valid through this day" date, so the whole expiry day still counts as valid. */
function expiryInfo(validUntil: string | undefined, now: Date) {
  if (!validUntil) return { expired: false, soon: false };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const parts = validUntil.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return { expired: false, soon: false };
  const expiry = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  const daysLeft = Math.round((expiry - today) / 86_400_000);
  return { expired: daysLeft < 0, soon: daysLeft >= 0 && daysLeft <= QUOTE_EXPIRY_WARNING_DAYS };
}

const spendOf = (orders: Order[]) =>
  orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + num(o.grandTotal), 0);

/** Money that came back to the buyer: the refund of every return that was inspected and refunded. */
const refundsOf = (returns: ReturnRequest[]) =>
  returns
    .filter((r) => r.status === "RECEIVED" || r.status === "REFUNDED")
    .reduce((sum, r) => sum + num(r.refundAmount), 0);

export function computeBuyerDashboardStats(input: BuyerDashboardInput): BuyerDashboardStats {
  const now = input.now ?? new Date();
  const { orders, returns, quotes, listedPrices = {}, range } = input;
  const win = resolveRange(range, now);

  const ordersIn = orders.filter((o) => inWindow(orderDate(o), win.from, win.to));
  const ordersPrev =
    win.prevFrom === null ? null : orders.filter((o) => inWindow(orderDate(o), win.prevFrom, win.prevTo as number));
  const returnsIn = returns.filter((r) => inWindow(r.requestedAt, win.from, win.to));
  const returnsPrev =
    win.prevFrom === null ? null : returns.filter((r) => inWindow(r.requestedAt, win.prevFrom, win.prevTo as number));
  const quotesIn = quotes.filter((q) => inWindow(q.createdAt, win.from, win.to));

  // ---- needs your attention (live: not affected by the date range) ----
  const quoted = quotes.filter((q) => q.status === "QUOTED").map((q) => ({ q, ...expiryInfo(q.quoteValidUntil, now) }));
  const accepted = quotes.filter((q) => q.status === "ACCEPTED").map((q) => ({ q, ...expiryInfo(q.quoteValidUntil, now) }));
  const refundsPending = returns.filter((r) => r.status === "RECEIVED");
  const attention = {
    quotesToReview: quoted.filter((e) => !e.expired).length,
    quotesExpiringSoon: [...quoted, ...accepted].filter((e) => e.soon).length,
    acceptedToOrder: accepted.filter((e) => !e.expired).length,
    acceptedExpired: accepted.filter((e) => e.expired).length,
    ordersInProgress: orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length,
    outForDelivery: orders.reduce(
      (n, o) => n + (o.sellerOrders ?? []).filter((so) => so.status === "OUT_FOR_DELIVERY").length,
      0
    ),
    returnsToShip: returns.filter((r) => r.status === "APPROVED").length,
    returnsToMarkOutForDelivery: returns.filter((r) => r.status === "SHIPPED").length,
    refundsOnTheWay: {
      amount: refundsPending.reduce((sum, r) => sum + num(r.refundAmount), 0),
      count: refundsPending.length,
    },
  };

  // ---- spend ----
  const totalSpend = spendOf(ordersIn);
  const refunds = refundsOf(returnsIn);
  const netSpend = Math.max(totalSpend - refunds, 0);
  const netSpendPrev =
    ordersPrev === null || returnsPrev === null ? null : Math.max(spendOf(ordersPrev) - refundsOf(returnsPrev), 0);
  const billable = ordersIn.filter((o) => o.status !== "CANCELLED");
  const quoteOrders = billable.filter((o) => o.quoteRequestId != null);

  let savings = 0;
  let savingsKnown = false;
  quoteOrders.forEach((order) =>
    order.sellerOrders?.forEach((so) =>
      so.items?.forEach((item) => {
        const listed = item.productId ? listedPrices[item.productId] : undefined;
        if (listed != null && item.unitPriceSnapshot != null) {
          savingsKnown = true;
          savings += Math.max(listed - item.unitPriceSnapshot, 0) * num(item.quantity);
        }
      })
    )
  );

  const spend = {
    ordersPlaced: ordersIn.length,
    ordersPlacedTrend: percentChange(ordersIn.length, ordersPrev?.length ?? null),
    totalSpend,
    totalSpendTrend: percentChange(totalSpend, ordersPrev === null ? null : spendOf(ordersPrev)),
    refunds,
    netSpend,
    netSpendTrend: percentChange(netSpend, netSpendPrev),
    averageOrderValue: billable.length > 0 ? totalSpend / billable.length : null,
    quoteOrders: quoteOrders.length,
    quoteOrdersValue: quoteOrders.reduce((sum, o) => sum + num(o.grandTotal), 0),
    quoteSavings: quoteOrders.length > 0 && savingsKnown ? savings : null,
  };

  // ---- performance ----
  const delivered = ordersIn.filter((o) => o.status === "DELIVERED");
  const cancelled = ordersIn.filter((o) => o.status === "CANCELLED");
  const returnedSellerOrderIds = new Set(
    returns.filter((r) => r.status !== "CANCELLED" && r.sellerOrderId).map((r) => r.sellerOrderId as string)
  );
  const returnedOrders = delivered.filter((o) =>
    (o.sellerOrders ?? []).some((so) => returnedSellerOrderIds.has(so.sellerOrderId))
  ).length;

  const deliveryDays = ordersIn
    .flatMap((o) => o.sellerOrders ?? [])
    .filter((so) => so.deliveredAt && so.createdAt)
    .map((so) => (new Date(so.deliveredAt as string).getTime() - new Date(so.createdAt as string).getTime()) / 86_400_000)
    .filter((d) => Number.isFinite(d) && d >= 0);

  const answered = quotesIn.filter((q) => q.status !== "PENDING");
  const won = quotesIn.filter((q) => q.status === "ACCEPTED" || q.status === "ORDER_PLACED");

  const performance = {
    delivered: delivered.length,
    cancelled: cancelled.length,
    cancelledByYou: cancelled.filter((o) => o.cancelledByRole?.toUpperCase() === "BUYER").length,
    cancelledBySeller: cancelled.filter((o) => o.cancelledByRole?.toUpperCase() === "SELLER").length,
    cancellationRate: ordersIn.length > 0 ? (cancelled.length / ordersIn.length) * 100 : null,
    returnRate: delivered.length > 0 ? (returnedOrders / delivered.length) * 100 : null,
    returnedOrders,
    avgDeliveryDays: deliveryDays.length > 0 ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length : null,
    quotesRaised: quotesIn.length,
    quotesAnswered: answered.length,
    quotesWon: won.length,
    quoteWinRate: answered.length > 0 ? (won.length / answered.length) * 100 : null,
  };

  // ---- charts / lists ----
  const trend = buildTrend(
    billable.map((o) => ({ createdAt: orderDate(o), amount: num(o.grandTotal) })),
    range,
    win.from,
    now
  );

  const statusCounts = new Map<string, number>();
  ordersIn.forEach((o) => statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1));
  const statusBreakdown = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const byProduct = new Map<string, BuyerTopProduct>();
  billable.forEach((order) =>
    order.sellerOrders?.forEach((so) =>
      so.items?.forEach((item) => {
        const key = item.productId ?? item.productNameSnapshot ?? "unknown";
        const row =
          byProduct.get(key) ?? { productId: item.productId ?? key, name: item.productNameSnapshot ?? key, units: 0, revenue: 0 };
        row.units += num(item.quantity);
        row.revenue += num(item.lineTotal);
        byProduct.set(key, row);
      })
    )
  );
  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => (orderDate(b) ?? "").localeCompare(orderDate(a) ?? ""))
    .slice(0, 5);

  return { attention, spend, performance, trend, statusBreakdown, topProducts, recentOrders };
}
