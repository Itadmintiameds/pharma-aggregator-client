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
      <div className="mb-2">
        <h2 className="text-sm font-heading font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-[11px] text-neutral-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const tileGrid = "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]";

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
    <div className="space-y-5">
      {/* Title row: date range + refresh */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-neutral-900">Business overview</h1>
          <p className="text-[11px] text-neutral-500">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Loading your numbers…"}
            {" · "}Sales and performance cover {range === "all" ? "all time" : range === "today" ? "today" : `the last ${rangeLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-lg border border-neutral-200 bg-white p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                aria-pressed={range === option.key}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {failed.length > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-body text-amber-900">
            <TriangleAlert size={14} className="mr-1.5 inline -translate-y-px" />
            Couldn&apos;t load your {failedLabels.join(", ")}. Anything that depends on it shows “—”.
          </p>
          <button onClick={refresh} className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      <Section title="Needs your attention" subtitle="Live — not affected by the date range">
        <div className={tileGrid}>
          <StatTile
            label="New Orders"
            value={String(attention.toConfirm)}
            icon={<ClipboardCheck size={16} />}
            tone={attention.overdue > 0 ? "danger" : tone(attention.toConfirm)}
            hint={attention.overdue > 0 ? `${attention.overdue} waiting more than 24h` : "New orders waiting for you"}
            href={`${BASE}/orders?status=PLACED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Ready to Ship"
            value={String(attention.toShip)}
            icon={<PackageCheck size={16} />}
            tone={tone(attention.toShip)}
            hint="Confirmed or packed, not yet shipped"
            href={`${BASE}/orders?status=CONFIRMED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="In Transit"
            value={String(attention.inTransit)}
            icon={<Truck size={16} />}
            hint="Shipped or out for delivery"
            href={`${BASE}/orders?status=SHIPPED`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Returns to action"
            value={String(attention.returnsToDecide + attention.returnsToInspect)}
            icon={<Undo2 size={16} />}
            tone={tone(attention.returnsToDecide + attention.returnsToInspect)}
            hint={`${attention.returnsToDecide} to decide · ${attention.returnsToInspect} to inspect`}
            href={`${BASE}/returns`}
            loading={loading}
            unavailable={has("returns")}
          />
          <StatTile
            label="New Quote Requests"
            value={String(attention.quotesToReply)}
            icon={<FileText size={16} />}
            tone={tone(attention.quotesToReply)}
            hint="Buyers waiting for your price"
            href={`${BASE}/conversions?status=PENDING`}
            loading={loading}
            unavailable={has("quotes")}
          />
          <StatTile
            label="Low Stock Alerts"
            value={String(stockAlerts)}
            icon={<Boxes size={16} />}
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
            label="Orders Received"
            value={sales.ordersReceived.toLocaleString("en-IN")}
            icon={<ShoppingBag size={16} />}
            trend={range === "all" ? undefined : sales.ordersReceivedTrend.percent}
            hint={range === "all" ? "Since you started selling" : undefined}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Gross Sales"
            value={formatMoney(sales.grossSales)}
            icon={<IndianRupee size={16} />}
            trend={range === "all" ? undefined : sales.grossSalesTrend.percent}
            hint={range === "all" ? "Value of all orders, cancelled excluded" : "Cancelled orders excluded"}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Net Sales"
            value={formatMoney(sales.netSales)}
            icon={<IndianRupee size={16} />}
            tone="good"
            trend={range === "all" ? undefined : sales.netSalesTrend.percent}
            hint={`Delivered orders after ${formatMoney(sales.refunds)} refunds`}
            loading={loading}
            unavailable={has("orders") || has("returns")}
          />
          <StatTile
            label="Average Order Value"
            value={sales.averageOrderValue === null ? "—" : formatMoney(sales.averageOrderValue)}
            icon={<Banknote size={16} />}
            hint="Per order, cancelled excluded"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Platform Fees"
            value={formatMoney(sales.commission)}
            icon={<Percent size={16} />}
            hint={`Plus ${formatMoney(sales.gstOnCommission)} GST on commission`}
            loading={loading}
            unavailable={has("commission")}
          />
          <StatTile
            label="Pending Payments"
            value={formatMoney(sales.pendingPayout)}
            icon={<Wallet size={16} />}
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
            label="Orders Delivered Successfully"
            value={formatPercent(performance.fulfilmentRate)}
            icon={<PackageCheck size={16} />}
            tone={performance.fulfilmentRate !== null && performance.fulfilmentRate < 80 ? "attention" : "default"}
            hint={`${performance.delivered} delivered · ${performance.cancelled} cancelled`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Cancelled Orders"
            value={formatPercent(performance.cancellationRate)}
            icon={<TriangleAlert size={16} />}
            tone={performance.cancellationRate !== null && performance.cancellationRate > 10 ? "attention" : "default"}
            hint={`${performance.cancelledBySeller} by you · ${performance.cancelledByBuyer} by buyers`}
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Returned Orders"
            value={formatPercent(performance.returnRate)}
            icon={<Undo2 size={16} />}
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
            label="Order Confirmation Time"
            value={formatHours(performance.avgConfirmHours)}
            icon={<Timer size={16} />}
            tone={performance.avgConfirmHours !== null && performance.avgConfirmHours > 24 ? "attention" : "default"}
            hint="From order placed to confirmed"
            loading={loading}
            unavailable={has("orders")}
          />
          <StatTile
            label="Successful Quotes"
            value={formatPercent(performance.quoteConversion)}
            icon={<Clock size={16} />}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 [&>section]:h-full">
          <SalesTrendPanel stats={stats} loading={loading} compact />
        </div>
        <OrderStatusPanel stats={stats} loading={loading} compact />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopProductsPanel stats={stats} products={productSummaries} loading={loading} compact />
        <InventoryPanel stats={stats} loading={loading} unavailable={has("products")} compact />
      </div>
    </div>
  );
}
