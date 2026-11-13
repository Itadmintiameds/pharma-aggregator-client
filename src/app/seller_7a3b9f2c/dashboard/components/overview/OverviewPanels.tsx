"use client";

import React from "react";
import Link from "next/link";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats } from "@/src/utils/sellerDashboardStats";
import { LOW_STOCK_THRESHOLD } from "@/src/utils/sellerDashboardStats";
import { formatMoney } from "@/src/utils/dashboardFormat";
import { ProductThumb, StatusBadge, type ProductSummary } from "../../../components/sellerCardUi";

const cardClass = "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm";

function PanelTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-p2 font-heading font-semibold text-neutral-900">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-p4 font-body text-neutral-500">{children}</p>;
}

export function SalesTrendPanel({
  stats,
  loading,
  title = "Sales over time",
  subtitle = "Order value (line) and number of orders (bars), cancelled orders excluded",
  valueLabel = "Order value",
}: {
  stats: Pick<DashboardStats, "trend">;
  loading: boolean;
  title?: string;
  subtitle?: string;
  /** What the line measures in the tooltip. */
  valueLabel?: string;
}) {
  const hasData = stats.trend.some((p) => p.orders > 0);
  return (
    <section className={cardClass}>
      <PanelTitle title={title} subtitle={subtitle} />
      {loading ? (
        <div className="h-[280px] animate-pulse rounded-xl bg-neutral-100" />
      ) : !hasData ? (
        <Empty>No orders in this period yet.</Empty>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEF" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B6B7B" }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis
                yAxisId="sales"
                tick={{ fontSize: 12, fill: "#6B6B7B" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => (v >= 1000 ? `₹${Math.round(v / 100) / 10}k` : `₹${v}`)}
              />
              <YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fontSize: 12, fill: "#6B6B7B" }} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                formatter={(value, name) =>
                  name === "Sales" ? [formatMoney(Number(value)), valueLabel] : [String(value), "Orders"]
                }
              />
              <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#DED0FE" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line yAxisId="sales" type="monotone" dataKey="sales" name="Sales" stroke="#5B1A9B" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function OrderStatusPanel({
  stats,
  loading,
  subtitle = "Orders received in this period",
}: {
  stats: Pick<DashboardStats, "statusBreakdown">;
  loading: boolean;
  subtitle?: string;
}) {
  const total = stats.statusBreakdown.reduce((sum, row) => sum + row.count, 0);
  return (
    <section className={cardClass}>
      <PanelTitle title="Orders by status" subtitle={subtitle} />
      {loading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-neutral-100" />
      ) : total === 0 ? (
        <Empty>No orders in this period yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {stats.statusBreakdown.map((row) => (
            <li key={row.status}>
              <div className="mb-1 flex items-center justify-between text-p4 font-body">
                <StatusBadge status={row.status} />
                <span className="font-semibold text-neutral-800">
                  {row.count} <span className="font-normal text-neutral-400">· {Math.round((row.count / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-primary-700" style={{ width: `${(row.count / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TopProductsPanel({
  stats,
  products,
  loading,
  title = "Top selling products",
  subtitle = "By order value in this period",
  unitsLabel = "units sold",
  emptyText = "No sales in this period yet.",
  linkHref = "/seller_7a3b9f2c/products",
  linkLabel = "All products",
}: {
  stats: Pick<DashboardStats, "topProducts">;
  products: Record<string, ProductSummary>;
  loading: boolean;
  title?: string;
  subtitle?: string;
  unitsLabel?: string;
  emptyText?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <section className={cardClass}>
      <PanelTitle
        title={title}
        subtitle={subtitle}
        action={
          <Link href={linkHref} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            {linkLabel}
          </Link>
        }
      />
      {loading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-neutral-100" />
      ) : stats.topProducts.length === 0 ? (
        <Empty>{emptyText}</Empty>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {stats.topProducts.map((product, index) => (
            <li key={product.productId} className="flex items-center gap-4 py-3">
              <span className="w-5 text-center text-p4 font-semibold text-neutral-400">{index + 1}</span>
              <ProductThumb src={products[product.productId]?.image} alt={product.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-p3 font-body font-semibold text-neutral-900">{product.name}</p>
                <p className="text-xs text-neutral-500">{product.units.toLocaleString("en-IN")} {unitsLabel}</p>
              </div>
              <p className="text-p3 font-body font-semibold text-neutral-900">{formatMoney(product.revenue)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Chip({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${warn && value > 0 ? "border-amber-200 bg-amber-50" : "border-neutral-200 bg-neutral-50"}`}>
      <p className={`text-h6 font-heading font-bold ${warn && value > 0 ? "text-amber-700" : "text-neutral-900"}`}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export function InventoryPanel({ stats, loading, unavailable }: { stats: DashboardStats; loading: boolean; unavailable: boolean }) {
  const { inventory } = stats;
  return (
    <section className={cardClass}>
      <PanelTitle
        title="Inventory"
        subtitle={`Low stock means ${LOW_STOCK_THRESHOLD} units or fewer`}
        action={
          <Link href="/seller_7a3b9f2c/products" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            Manage stock
          </Link>
        }
      />
      {loading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-neutral-100" />
      ) : unavailable ? (
        <Empty>Inventory could not be loaded right now.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Chip label="Published" value={inventory.published} />
            <Chip label="Drafts" value={inventory.drafts} />
            <Chip label="Out of stock" value={inventory.outOfStock} warn />
            <Chip label="Expiring ≤ 60 days" value={inventory.expiringBatches} warn />
          </div>
          {inventory.alerts.length === 0 ? (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-p4 font-body text-green-800">
              All published products are well stocked.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {inventory.alerts.map((alert) => (
                <li key={alert.productId} className="flex items-center justify-between gap-3 py-2">
                  <p className="truncate text-p4 font-body text-neutral-800">{alert.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      alert.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {alert.stock === 0 ? "Out of stock" : `${alert.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

