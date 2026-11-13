"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CircleCheck,
  Clock,
  FileText,
  FileWarning,
  IndianRupee,
  Package,
  Percent,
  PiggyBank,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Timer,
  TriangleAlert,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import { useBuyerDashboardData } from "@/src/hooks/useBuyerDashboardData";
import { useCart } from "@/src/context/CartContext";
import type { RawTempBuyerDocument } from "@/src/services/buyer/buyerRegistrationService";
import type { Order } from "@/src/types/buyer/order";
import { computeBuyerDashboardStats, QUOTE_EXPIRY_WARNING_DAYS } from "@/src/utils/buyerDashboardStats";
import { RANGE_OPTIONS, RangeKey } from "@/src/utils/dashboardRange";
import { formatHours, formatMoney, formatPercent } from "@/src/utils/dashboardFormat";
import StatTile, { Tone } from "@/src/app/commonComponents/StatTile";
import { ProductSummary, ProductThumb, StatusBadge, useProductSummaries } from "@/src/app/commonComponents/cardUi";
import {
  OrderStatusPanel,
  SalesTrendPanel,
  TopProductsPanel,
} from "@/src/app/seller_7a3b9f2c/dashboard/components/overview/OverviewPanels";
import DocumentExpiryCard from "./DocumentExpiryCard";
import { useBuyerCartDrawer } from "../../context/BuyerCartDrawerContext";

const BASE = "/buyer_e8d45a1b/dashboard";
const DOCUMENT_WARN_DAYS = 60;
const tileGrid = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-p2 font-heading font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** Licences / documents that have expired or expire within DOCUMENT_WARN_DAYS. */
function documentIssues(documents?: RawTempBuyerDocument[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expired = 0;
  let expiring = 0;
  (documents ?? []).forEach((doc) => {
    if (!doc.licenseExpiryDate) return;
    const date = new Date(doc.licenseExpiryDate);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) expired++;
    else if (days <= DOCUMENT_WARN_DAYS) expiring++;
  });
  return { expired, expiring };
}

function RecentOrdersPanel({
  orders,
  products,
  loading,
  unavailable,
}: {
  orders: Order[];
  products: Record<string, ProductSummary>;
  loading: boolean;
  unavailable: boolean;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-p2 font-heading font-semibold text-neutral-900">Recent orders</h3>
          <p className="text-xs text-neutral-500">Your latest orders, newest first</p>
        </div>
        <Link
          href={`${BASE}/orders`}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          All orders
        </Link>
      </div>
      {loading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-neutral-100" />
      ) : unavailable ? (
        <p className="py-10 text-center text-p4 font-body text-neutral-500">Your orders could not be loaded right now.</p>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-p4 font-body text-neutral-500">You haven&apos;t placed any orders yet.</p>
          <Link href={`${BASE}/catalog`} className="mt-3 inline-block rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {orders.map((order) => {
            const items = order.sellerOrders.flatMap((so) => so.items);
            const first = items[0];
            const placed = order.placedAt ?? order.createdAt;
            return (
              <li key={order.orderId}>
                <Link href={`${BASE}/orders/${order.orderId}`} className="flex items-center gap-4 py-3 hover:bg-neutral-50">
                  <ProductThumb
                    src={first?.productId ? products[first.productId]?.image : undefined}
                    alt={first?.productNameSnapshot ?? "Order"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-p3 font-body font-semibold text-neutral-900">
                      {first?.productNameSnapshot ?? order.orderId}
                      {items.length > 1 && <span className="font-normal text-neutral-500"> +{items.length - 1} more</span>}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.orderId}
                      {placed ? ` · ${new Date(placed).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
                      {order.quoteRequestId != null && (
                        <span className="ml-1.5 rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-800">Quotation</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} />
                    <span className="text-p4 font-body font-semibold text-neutral-900">{formatMoney(order.grandTotal ?? 0)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function BuyerOverview({ documents }: { documents?: RawTempBuyerDocument[] }) {
  const { data, loading, failed, failedLabels, lastUpdated, refresh } = useBuyerDashboardData();
  const { totalItems: cartItems, totalPrice: cartValue } = useCart();
  const { openCart } = useBuyerCartDrawer();
  const [range, setRange] = useState<RangeKey>("30d");

  // Product images for the lists, and current listed prices to estimate what quotation orders saved.
  const productIds = useMemo(() => {
    const ids = new Set<string>();
    [...data.orders]
      .sort((a, b) => (b.placedAt ?? b.createdAt ?? "").localeCompare(a.placedAt ?? a.createdAt ?? ""))
      .slice(0, 12)
      .forEach((o) => o.sellerOrders.forEach((so) => so.items.forEach((i) => i.productId && ids.add(i.productId))));
    data.orders
      .filter((o) => o.quoteRequestId != null)
      .forEach((o) => o.sellerOrders.forEach((so) => so.items.forEach((i) => i.productId && ids.add(i.productId))));
    return [...ids];
  }, [data.orders]);
  const summaries = useProductSummaries(productIds);
  const listedPrices = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(summaries).forEach(([id, summary]) => {
      if (summary.listedPrice != null) map[id] = summary.listedPrice;
    });
    return map;
  }, [summaries]);

  const stats = useMemo(() => computeBuyerDashboardStats({ ...data, listedPrices, range }), [data, listedPrices, range]);
  const { attention, spend, performance } = stats;
  const docs = documentIssues(documents);
  const docAttention = docs.expired + docs.expiring;

  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === range)?.label.toLowerCase() ?? "";
  const has = (source: (typeof failed)[number]) => failed.includes(source);
  const tone = (count: number, level: Tone = "attention"): Tone => (count > 0 ? level : "default");
  const returnsToAction = attention.returnsToShip + attention.returnsToMarkOutForDelivery;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h4 font-heading font-bold text-pneutral-900">Overview</h2>
          <p className="text-xs text-neutral-500">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading your numbers…"}
            {" · "}Spend and performance cover {range === "all" ? "all time" : range === "today" ? "today" : `the last ${rangeLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-xl border border-neutral-200 bg-white p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                aria-pressed={range === option.key}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  range === option.key ? "bg-primary-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh dashboard"
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {failed.length > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-p4 font-body text-amber-900">
            <TriangleAlert size={16} className="mr-1.5 inline -translate-y-px" />
            Couldn&apos;t load your {failedLabels.join(", ")}. Anything that depends on it shows “—”.
          </p>
          <button onClick={refresh} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      <Section title="Needs your attention" subtitle="Live — not affected by the date range">
        <div className={tileGrid}>
          <StatTile
            label="Quotes to review"
            value={String(attention.quotesToReview)}
            icon={<FileText size={18} />}
            tone={tone(attention.quotesToReview)}
            hint={
              attention.quotesExpiringSoon > 0
                ? `${attention.quotesExpiringSoon} run out within ${QUOTE_EXPIRY_WARNING_DAYS} days`
                : "Sellers are waiting for your answer"
            }
            href={`${BASE}/rfq?status=QUOTED`}
            loading={loading}
            unavailable={has("quotes")}
          />
          <StatTile
            label="Accepted quotes to order"
            value={String(attention.acceptedToOrder)}
            icon={<CircleCheck size={18} />}
            tone={tone(attention.acceptedToOrder)}
            hint={
              attention.acceptedExpired > 0
                ? `${attention.acceptedExpired} expired — ask for a new quote`
                : "Place the order at the agreed price"
            }
            href={`${BASE}/rfq?status=ACCEPTED`}
            loading={loading}
            unavailable={has("quotes")}
          />
          <StatTile
            label="Orders in progress"
            value={String(attention.ordersInProgress)}
            icon={<Truck size={18} />}
            tone={attention.outForDelivery > 0 ? "attention" : "default"}
            hint={
              attention.outForDelivery > 0
                ? `${attention.outForDelivery} out for delivery — keep your delivery OTP ready`
                : "Placed, packed or on the way"
            }
            href={`${BASE}/orders`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Returns to action"
            value={String(returnsToAction)}
            icon={<Undo2 size={18} />}
            tone={tone(returnsToAction)}
            hint={`${attention.returnsToShip} to ship back · ${attention.returnsToMarkOutForDelivery} to mark out for delivery`}
            href={`${BASE}/returns`}
            loading={loading}
            unavailable={has("returns")}
          />
          <StatTile
            label="Documents needing attention"
            value={String(docAttention)}
            icon={<FileWarning size={18} />}
            tone={docs.expired > 0 ? "danger" : tone(docAttention)}
            hint={
              docAttention === 0
                ? "All licences are valid"
                : `${docs.expired} expired · ${docs.expiring} expiring within ${DOCUMENT_WARN_DAYS} days`
            }
            href={`${BASE}/profile`}
            loading={false}
          />
          <StatTile
            label="Items in your cart"
            value={String(cartItems)}
            icon={<ShoppingCart size={18} />}
            hint={cartItems > 0 ? `Worth ${formatMoney(cartValue)} — ready to check out` : "Your cart is empty"}
            onClick={openCart}
            loading={false}
          />
        </div>
      </Section>

      <Section title="Spend" subtitle="Orders placed in the selected period">
        <div className={tileGrid}>
          <StatTile
            label="Orders placed"
            value={spend.ordersPlaced.toLocaleString("en-IN")}
            icon={<ShoppingBag size={18} />}
            trend={range === "all" ? undefined : spend.ordersPlacedTrend.percent}
            hint={range === "all" ? "Since you started buying" : undefined}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Total spend"
            value={formatMoney(spend.totalSpend)}
            icon={<IndianRupee size={18} />}
            trend={range === "all" ? undefined : spend.totalSpendTrend.percent}
            hint={range === "all" ? "Value of all orders, cancelled excluded" : "Cancelled orders excluded"}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Net spend"
            value={formatMoney(spend.netSpend)}
            icon={<Wallet size={18} />}
            tone="good"
            trend={range === "all" ? undefined : spend.netSpendTrend.percent}
            hint={`After ${formatMoney(spend.refunds)} in refunds`}
            loading={loading}
            unavailable={has("orders") || has("returns")}
          />
          <StatTile
            label="Average order value"
            value={spend.averageOrderValue === null ? "—" : formatMoney(spend.averageOrderValue)}
            icon={<Banknote size={18} />}
            hint="Per order, cancelled excluded"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Quotation orders"
            value={String(spend.quoteOrders)}
            icon={<PiggyBank size={18} />}
            tone={spend.quoteSavings ? "good" : "default"}
            hint={
              spend.quoteSavings
                ? `Saved about ${formatMoney(spend.quoteSavings)} vs today's listed prices`
                : spend.quoteOrders > 0
                  ? `Worth ${formatMoney(spend.quoteOrdersValue)}`
                  : "Orders placed at a quoted price"
            }
            href={`${BASE}/quotation-orders`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Refunds received"
            value={formatMoney(spend.refunds)}
            icon={<Percent size={18} />}
            hint={
              attention.refundsOnTheWay.count > 0
                ? `${formatMoney(attention.refundsOnTheWay.amount)} more on the way`
                : "No refunds pending"
            }
            href={`${BASE}/returns`}
            loading={loading}
            unavailable={has("returns")}
          />
        </div>
      </Section>

      <Section title="Performance" subtitle="How your orders and quotes are going in the selected period">
        <div className={tileGrid}>
          <StatTile
            label="Orders delivered"
            value={String(performance.delivered)}
            icon={<Package size={18} />}
            hint={`${performance.cancelled} cancelled in this period`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Average delivery time"
            value={formatHours(performance.avgDeliveryDays === null ? null : performance.avgDeliveryDays * 24)}
            icon={<Timer size={18} />}
            hint="From order placed to delivered"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Cancellation rate"
            value={formatPercent(performance.cancellationRate)}
            icon={<TriangleAlert size={18} />}
            tone={performance.cancellationRate !== null && performance.cancellationRate > 10 ? "attention" : "default"}
            hint={`${performance.cancelledByYou} by you · ${performance.cancelledBySeller} by sellers`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Return rate"
            value={formatPercent(performance.returnRate)}
            icon={<Undo2 size={18} />}
            hint={
              performance.returnedOrders > 0
                ? `${performance.returnedOrders} of ${performance.delivered} delivered orders returned`
                : "No returns in this period"
            }
            loading={loading}
            unavailable={has("orders") || has("returns")}
          />
          <StatTile
            label="Quote win rate"
            value={formatPercent(performance.quoteWinRate)}
            icon={<Clock size={18} />}
            hint={
              performance.quotesAnswered > 0
                ? `${performance.quotesWon} accepted of ${performance.quotesAnswered} answered · ${performance.quotesRaised} raised`
                : `${performance.quotesRaised} raised, none answered yet`
            }
            href={`${BASE}/rfq`}
            loading={loading}
            unavailable={has("quotes")}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendPanel
            stats={stats}
            loading={loading}
            title="Spending over time"
            subtitle="Order value (line) and number of orders (bars), cancelled orders excluded"
            valueLabel="Spend"
          />
        </div>
        <OrderStatusPanel stats={stats} loading={loading} subtitle="Your orders placed in this period" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopProductsPanel
          stats={stats}
          products={summaries}
          loading={loading}
          title="Most purchased products"
          subtitle="By amount spent in this period"
          unitsLabel="units bought"
          emptyText="No purchases in this period yet."
          linkHref={`${BASE}/catalog`}
          linkLabel="Browse catalog"
        />
        <RecentOrdersPanel orders={stats.recentOrders} products={summaries} loading={loading} unavailable={has("orders")} />
      </div>

      <DocumentExpiryCard documents={documents} />
    </div>
  );
}
