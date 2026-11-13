/** ₹ with Indian digit grouping; paise only for small amounts, where they matter. */
export function formatMoney(value: number): string {
  const abs = Math.abs(value);
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: abs >= 1000 ? 0 : 2,
  })}`;
}

export function formatPercent(value: number | null, digits = 0): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}

export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(Math.round(hours * 60), 1)} min`;
  if (hours < 48) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 && hours < 10 ? `${h}h ${m}m` : `${Math.round(hours)}h`;
  }
  return `${(hours / 24).toFixed(1)} days`;
}
