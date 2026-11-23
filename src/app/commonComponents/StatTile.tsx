"use client";

import React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";

export type Tone = "default" | "attention" | "danger" | "good";

const TONE_STYLES: Record<Tone, { card: string; icon: string }> = {
  default: { card: "border-neutral-200", icon: "bg-primary-50 text-primary-800" },
  attention: { card: "border-amber-300 bg-amber-50/40", icon: "bg-amber-100 text-amber-700" },
  danger: { card: "border-red-300 bg-red-50/40", icon: "bg-red-100 text-red-700" },
  good: { card: "border-green-200", icon: "bg-green-50 text-green-700" },
};

interface StatTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  /** Small supporting line under the value. */
  hint?: React.ReactNode;
  /** Percent change against the previous period. `undefined` hides it; `null` means "nothing to compare". */
  trend?: number | null;
  tone?: Tone;
  /** Makes the whole tile a link (used by the "needs your attention" tiles). */
  href?: string;
  /** Makes the whole tile a button instead (for actions that open a panel rather than a page). */
  onClick?: () => void;
  loading?: boolean;
  /** The data behind this tile could not be loaded. */
  unavailable?: boolean;
}

function TrendBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-[11px] text-neutral-400">No earlier data to compare</span>;
  const up = percent >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-green-700" : "text-red-600"}`}>
      <Icon size={12} />
      {Math.abs(percent).toFixed(percent !== 0 && Math.abs(percent) < 10 ? 1 : 0)}%
      <span className="font-normal text-neutral-500">vs previous period</span>
    </span>
  );
}

export default function StatTile({
  label,
  value,
  icon,
  hint,
  trend,
  tone = "default",
  href,
  onClick,
  loading,
  unavailable,
}: StatTileProps) {
  const styles = TONE_STYLES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-body font-medium text-neutral-600">{label}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${styles.icon}`}>{icon}</span>
      </div>
      <p
        className={`mt-1 text-lg font-heading font-bold leading-tight text-neutral-900 ${loading ? "animate-pulse text-neutral-300" : ""}`}
        title={unavailable ? "Could not be loaded" : undefined}
      >
        {loading ? "…" : unavailable ? "—" : value}
      </p>
      <div className="mt-0.5 min-h-[16px]">
        {unavailable ? (
          <span className="text-[11px] text-neutral-400">Unavailable right now</span>
        ) : !loading && trend !== undefined ? (
          <TrendBadge percent={trend} />
        ) : !loading && hint ? (
          <span className="text-[11px] leading-snug text-neutral-500">{hint}</span>
        ) : null}
      </div>
      {!loading && !unavailable && trend !== undefined && hint && (
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">{hint}</p>
      )}
    </>
  );

  const className = `relative block w-full rounded-xl border bg-white p-3.5 text-left shadow-sm transition-shadow ${styles.card} ${
    href || onClick ? "hover:shadow-md" : ""
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
        <ChevronRight size={14} className="absolute bottom-3 right-3 text-neutral-300" aria-hidden />
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
        <ChevronRight size={14} className="absolute bottom-3 right-3 text-neutral-300" aria-hidden />
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
