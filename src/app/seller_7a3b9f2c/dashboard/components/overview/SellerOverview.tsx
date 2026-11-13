"use client";

import React, { useMemo, useState } from "react";
import {
  Banknote,
  Boxes,
  ClipboardCheck,
  Clock,
  FileText,
  IndianRupee,
  Percent,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Timer,
  TriangleAlert,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import { useSellerDashboardData } from "@/src/hooks/useSellerDashboardData";
import { useProductSummaries } from "../../../components/sellerCardUi";
import { computeDashboardStats, RANGE_OPTIONS, RangeKey } from "@/src/utils/sellerDashboardStats";
import { formatHours, formatMoney, formatPercent } from "@/src/utils/dashboardFormat";
import { reasonLabel } from "@/src/types/buyer/returns";
import StatTile, { Tone } from "./StatTile";
import { InventoryPanel, OrderStatusPanel, SalesTrendPanel, TopProductsPanel } from "./OverviewPanels";

const BASE = "/seller_7a3b9f2c";

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

const tileGrid = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

export default function SellerOverview() {
  const { data, loading, failed, failedLabels, lastUpdated, refresh } = useSellerDashboardData();
  const [range, setRange] = useState<RangeKey>("30d");

  const stats = useMemo(() => computeDashboardStats({ ...data, range }), [data, range]);
  const productIds = useMemo(
    () => [...stats.topProducts.map((p) => p.productId)],
    [stats.topProducts]
  );
  const productSummaries = useProductSummaries(productIds);

  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === range)?.label.toLowerCase() ?? "";
  const has = (source: (typeof failed)[number]) => failed.includes(source);
  const { attention, sales, performance, inventory } = stats;

  const tone = (count: number, level: Tone = "attention"): Tone => (count > 0 ? level : "default");
  const stockAlerts = inventory.outOfStock + inventory.lowStock;

  return (
    <div className="space-y-8">
      {/* Title row: date range + refresh */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h5 font-heading font-semibold text-neutral-900">Business overview</h1>
          <p className="text-xs text-neutral-500">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Loading your numbers…"}
            {" · "}Sales and performance cover {range === "all" ? "all time" : range === "today" ? "today" : `the last ${rangeLabel}`}
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
            label="Orders to confirm"
            value={String(attention.toConfirm)}
            icon={<ClipboardCheck size={18} />}
            tone={attention.overdue > 0 ? "danger" : tone(attention.toConfirm)}
            hint={attention.overdue > 0 ? `${attention.overdue} waiting more than 24h` : "New orders waiting for you"}
            href={`${BASE}/orders?status=PLACED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Orders to pack & ship"
            value={String(attention.toShip)}
            icon={<PackageCheck size={18} />}
            tone={tone(attention.toShip)}
            hint="Confirmed or packed, not yet shipped"
            href={`${BASE}/orders?status=CONFIRMED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Shipped, awaiting delivery"
            value={String(attention.inTransit)}
            icon={<Truck size={18} />}
            hint="Shipped or out for delivery"
            href={`${BASE}/orders?status=SHIPPED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Returns to action"
            value={String(attention.returnsToDecide + attention.returnsToInspect)}
            icon={<Undo2 size={18} />}
            tone={tone(attention.returnsToDecide + attention.returnsToInspect)}
            hint={`${attention.returnsToDecide} to decide · ${attention.returnsToInspect} to inspect`}
            href={`${BASE}/returns`}
            loading={loading}
            unavailable={has("returns")}
          />
          <StatTile
            label="Quote requests to answer"
            value={String(attention.quotesToReply)}
            icon={<FileText size={18} />}
            tone={tone(attention.quotesToReply)}
            hint="Buyers waiting for your price"
            href={`${BASE}/conversions?status=PENDING`}
            loading={loading}
            unavailable={has("quotes")}
          />
          <StatTile
            label="Stock alerts"
            value={String(stockAlerts)}
            icon={<Boxes size={18} />}
            tone={inventory.outOfStock > 0 ? "danger" : tone(stockAlerts)}
            hint={`${inventory.outOfStock} out of stock · ${inventory.lowStock} running low`}
            href={`${BASE}/products`}
            loading={loading}
            unavailable={has("products")}
          />
        </div>
      </Section>

      <Section title="Sales & earnings" subtitle="Orders placed in the selected period">
        <div className={tileGrid}>
          <StatTile
            label="Orders received"
            value={sales.ordersReceived.toLocaleString("en-IN")}
            icon={<ShoppingBag size={18} />}
            trend={range === "all" ? undefined : sales.ordersReceivedTrend.percent}
            hint={range === "all" ? "Since you started selling" : undefined}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Gross sales"
            value={formatMoney(sales.grossSales)}
            icon={<IndianRupee size={18} />}
            trend={range === "all" ? undefined : sales.grossSalesTrend.percent}
            hint={range === "all" ? "Value of all orders, cancelled excluded" : "Cancelled orders excluded"}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Net sales"
            value={formatMoney(sales.netSales)}
            icon={<IndianRupee size={18} />}
            tone="good"
            trend={range === "all" ? undefined : sales.netSalesTrend.percent}
            hint={`Delivered orders after ${formatMoney(sales.refunds)} refunds`}
            loading={loading}
            unavailable={has("orders") || has("returns")}
          />
          <StatTile
            label="Average order value"
            value={sales.averageOrderValue === null ? "—" : formatMoney(sales.averageOrderValue)}
            icon={<Banknote size={18} />}
            hint="Per order, cancelled excluded"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Platform commission"
            value={formatMoney(sales.commission)}
            icon={<Percent size={18} />}
            hint={`Plus ${formatMoney(sales.gstOnCommission)} GST on commission`}
            loading={loading}
            unavailable={has("commission")}
          />
          <StatTile
            label="Payout pending"
            value={formatMoney(sales.pendingPayout)}
            icon={<Wallet size={18} />}
            tone={tone(sales.pendingPayout, "good")}
            hint={
              sales.lastPayout
                ? `Paid out so far ${formatMoney(sales.paidOut)} · last ${formatMoney(sales.lastPayout.amount)}`
                : "Approved settlements not yet paid"
            }
            loading={loading}
            unavailable={has("payouts")}
          />
        </div>
      </Section>

      <Section title="Performance" subtitle="How well you are serving buyers in the selected period">
        <div className={tileGrid}>
          <StatTile
            label="Fulfilment rate"
            value={formatPercent(performance.fulfilmentRate)}
            icon={<PackageCheck size={18} />}
            tone={performance.fulfilmentRate !== null && performance.fulfilmentRate < 80 ? "attention" : "default"}
            hint={`${performance.delivered} delivered · ${performance.cancelled} cancelled`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Cancellation rate"
            value={formatPercent(performance.cancellationRate)}
            icon={<TriangleAlert size={18} />}
            tone={performance.cancellationRate !== null && performance.cancellationRate > 10 ? "attention" : "default"}
            hint={`${performance.cancelledBySeller} by you · ${performance.cancelledByBuyer} by buyers`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Return rate"
            value={formatPercent(performance.returnRate)}
            icon={<Undo2 size={18} />}
            tone={performance.returnRate !== null && performance.returnRate > 10 ? "attention" : "default"}
            hint={
              performance.returnedOrders > 0
                ? `${performance.returnedOrders} of ${performance.delivered} delivered orders returned${
                    performance.topReturnReason ? ` · mostly “${reasonLabel(performance.topReturnReason)}”` : ""
                  }`
                : "No returns in this period"
            }
            loading={loading}
            unavailable={has("orders") || has("returns")}
          />
          <StatTile
            label="Average time to confirm"
            value={formatHours(performance.avgConfirmHours)}
            icon={<Timer size={18} />}
            tone={performance.avgConfirmHours !== null && performance.avgConfirmHours > 24 ? "attention" : "default"}
            hint="From order placed to confirmed"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Quote conversion"
            value={formatPercent(performance.quoteConversion)}
            icon={<Clock size={18} />}
            hint={
              performance.quotesAnswered > 0
                ? `${performance.quotesWon} accepted of ${performance.quotesAnswered} answered`
                : "No answered quotes in this period"
            }
            loading={loading}
            unavailable={has("quotes")}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 [&>section]:h-full">
          <SalesTrendPanel stats={stats} loading={loading} />
        </div>
        <OrderStatusPanel stats={stats} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopProductsPanel stats={stats} products={productSummaries} loading={loading} />
        <InventoryPanel stats={stats} loading={loading} unavailable={has("products")} />
      </div>
    </div>
  );
}
