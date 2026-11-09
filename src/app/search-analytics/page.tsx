"use client";

import { useEffect, useState } from "react";
import { AnalyticsReport, Funnel, FilterUsage, ProductStats, TermStats } from "@/src/types/searchAnalytics";

// Internal dashboard for the search analytics (what buyers search for, what finds nothing, which products get
// clicked / carted / quoted / ordered, how filters are used). Not linked from anywhere. The data comes through
// /api/search-analytics/*, a server-side route that holds the internal key (see that file for who may open it).

const PERIODS = [7, 30, 90] as const;
const TOKEN_KEY = "tiameds.analyticsToken.v1";

interface Loaded {
  /** which request this answers; "loading" is derived from it not matching the current request */
  key: string;
  funnel?: Funnel;
  terms?: TermStats[];
  zero?: TermStats[];
  products?: ProductStats[];
  filters?: FilterUsage[];
  error?: string;
  tokenRequired?: boolean;
}

class ReportError extends Error {
  constructor(message: string, readonly tokenRequired: boolean) {
    super(message);
  }
}

async function fetchReport<T>(report: AnalyticsReport, days: number, token: string, signal: AbortSignal): Promise<T> {
  const limit = report === "funnel" ? "" : "&limit=15";
  const response = await fetch(`/api/search-analytics/${report}?days=${days}${limit}`, {
    headers: token ? { "x-analytics-token": token } : undefined,
    cache: "no-store",
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as { data?: T; error?: string; tokenRequired?: boolean };
  if (!response.ok) throw new ReportError(body.error ?? `Report failed (${response.status})`, !!body.tokenRequired);
  return body.data as T;
}

const pct = (rate: number | undefined) => (rate === undefined ? "–" : `${(rate * 100).toFixed(1)}%`);
const num = (n: number | undefined) => (n === undefined ? "–" : n.toLocaleString("en-IN"));

export default function SearchAnalyticsPage() {
  const [days, setDays] = useState<number>(7);
  const [token, setToken] = useState<string>(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(TOKEN_KEY) ?? ""
  );
  const [tokenInput, setTokenInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Loaded>({ key: "" });

  const requestKey = `${days}|${token}|${reloadKey}`;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      fetchReport<Funnel>("funnel", days, token, signal),
      fetchReport<TermStats[]>("top-terms", days, token, signal),
      fetchReport<TermStats[]>("zero-results", days, token, signal),
      fetchReport<ProductStats[]>("top-products", days, token, signal),
      fetchReport<FilterUsage[]>("filters", days, token, signal),
    ])
      .then(([funnel, terms, zero, products, filters]) =>
        setResult({ key: requestKey, funnel, terms, zero, products, filters })
      )
      .catch((error: unknown) => {
        if (signal.aborted) return;
        setResult({
          key: requestKey,
          error: error instanceof Error ? error.message : "Could not load the analytics.",
          tokenRequired: error instanceof ReportError && error.tokenRequired,
        });
      });
    return () => controller.abort();
  }, [days, token, requestKey]);

  const loading = result.key !== requestKey;
  const { funnel, terms, zero, products, filters } = result;
  const error = loading ? undefined : result.error;

  const applyToken = () => {
    const value = tokenInput.trim();
    try {
      sessionStorage.setItem(TOKEN_KEY, value);
    } catch {
      // storage blocked: the token only lasts for this page view
    }
    setToken(value);
  };

  return (
    <main className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Search analytics</h1>
            <p className="text-sm text-neutral-500 mt-1">
              What buyers search for, what finds nothing, and what they do with the results. Anonymous data; kept 90 days.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  days === p
                    ? "bg-primary-800 border-primary-800 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Last {p} days
              </button>
            ))}
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-3">
            <p>{error}</p>
            {result.tokenRequired && (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyToken()}
                  placeholder="Analytics token"
                  aria-label="Analytics token"
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-neutral-900"
                />
                <button onClick={applyToken} className="rounded-md bg-primary-800 px-3 py-1.5 text-white">
                  Open
                </button>
              </div>
            )}
          </div>
        )}

        {loading && !funnel && <p className="text-neutral-500">Loading…</p>}

        {funnel && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {funnel.searches === 0 && (
              <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                No searches recorded in this period yet. Events are only collected once the search service runs the
                analytics build and buyers use the storefront search.
              </p>
            )}

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Searches" value={num(funnel.searches)} />
                <Stat label="Found nothing" value={pct(funnel.zeroResultRate)} hint={`${num(funnel.zeroResultSearches)} searches`} />
                <Stat label="Click-through" value={pct(funnel.clickThroughRate)} hint="searches with a click" />
                <Stat
                  label="Avg click position"
                  value={funnel.avgClickPosition === null ? "–" : (funnel.avgClickPosition + 1).toFixed(1)}
                  hint="1 = first result"
                />
                <Stat label="Add to cart" value={pct(funnel.addToCartRate)} hint={`${num(funnel.addToCarts)} adds`} />
                <Stat label="Quote request" value={pct(funnel.quoteRate)} hint={`${num(funnel.quoteRequests)} requests`} />
                <Stat label="Order" value={pct(funnel.orderRate)} hint={`${num(funnel.orders)} orders`} />
                <Stat label="Result clicks" value={num(funnel.clicks)} />
              </div>

              <div className="mt-5 rounded-xl bg-white shadow-sm p-4 space-y-2">
                <p className="text-sm font-medium text-neutral-700 mb-1">From search to sale (distinct searches)</p>
                <FunnelBar label="Searched" value={funnel.searches} of={funnel.searches} />
                <FunnelBar label="Clicked a result" value={funnel.searchesWithClick} of={funnel.searches} />
                <FunnelBar label="Added to cart" value={funnel.searchesWithAddToCart} of={funnel.searches} />
                <FunnelBar label="Asked for a quote" value={funnel.searchesWithQuote} of={funnel.searches} />
                <FunnelBar label="Ordered" value={funnel.searchesWithOrder} of={funnel.searches} />
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Most searched terms</h2>
              <TermTable rows={terms ?? []} empty="No text searches yet." />
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-1">Searches that found nothing</h2>
              <p className="text-sm text-neutral-500 mb-3">
                Fix these with a synonym (brand → molecule) or by adding the missing product to the catalogue.
              </p>
              <TermTable rows={zero ?? []} empty="Every search found something." />
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Products found through search</h2>
              <ProductTable rows={products ?? []} />
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Filters and sorting used</h2>
              <FilterTable rows={filters ?? []} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white shadow-sm p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function FunnelBar({ label, value, of }: { label: string; value: number; of: number }) {
  const width = of > 0 ? Math.max(2, Math.round((value / of) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-neutral-600">{label}</span>
      <div className="flex-1 h-5 rounded bg-neutral-100 overflow-hidden">
        <div className="h-full bg-primary-700" style={{ width: `${width}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right text-neutral-800 tabular-nums">
        {num(value)} {of > 0 && <span className="text-neutral-400">({pct(value / of)})</span>}
      </span>
    </div>
  );
}

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";
const td = "px-3 py-2 text-sm text-neutral-800 tabular-nums";

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-100">{children}</table>
    </div>
  );
}

function TermTable({ rows, empty }: { rows: TermStats[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-neutral-500">{empty}</p>;
  return (
    <TableShell>
      <thead>
        <tr>
          <th className={th}>Term</th>
          <th className={th}>Searches</th>
          <th className={th}>Avg results</th>
          <th className={th}>Found nothing</th>
          <th className={th}>Click-through</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        {rows.map((row) => (
          <tr key={row.term}>
            <td className={`${td} font-medium`}>{row.term}</td>
            <td className={td}>{num(row.searches)}</td>
            <td className={td}>{row.avgResults.toFixed(1)}</td>
            <td className={td}>{num(row.zeroResultSearches)}</td>
            <td className={td}>{pct(row.clickThroughRate)}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function ProductTable({ rows }: { rows: ProductStats[] }) {
  if (rows.length === 0) return <p className="text-sm text-neutral-500">No product activity from search yet.</p>;
  return (
    <TableShell>
      <thead>
        <tr>
          <th className={th}>Product</th>
          <th className={th}>Clicks</th>
          <th className={th}>Added to cart</th>
          <th className={th}>Quotes</th>
          <th className={th}>Orders</th>
          <th className={th}>Avg position</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        {rows.map((row) => (
          <tr key={row.productId}>
            <td className={td}>
              <span className="font-medium">{row.productName ?? row.productId}</span>
              {row.manufacturerName && <span className="block text-xs text-neutral-400">{row.manufacturerName}</span>}
            </td>
            <td className={td}>{num(row.clicks)}</td>
            <td className={td}>{num(row.addToCarts)}</td>
            <td className={td}>{num(row.quoteRequests)}</td>
            <td className={td}>{num(row.orders)}</td>
            <td className={td}>{row.avgClickPosition === null ? "–" : (row.avgClickPosition + 1).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

const DIMENSION_LABELS: Record<string, string> = {
  category: "Category",
  therapeuticCategory: "Therapeutic area",
  dosageForm: "Dosage form",
  packType: "Pack type",
  manufacturerName: "Manufacturer",
  sort: "Sort order",
  priceFilter: "Price filter",
  inStockOnly: "In stock only",
};

function FilterTable({ rows }: { rows: FilterUsage[] }) {
  if (rows.length === 0) return <p className="text-sm text-neutral-500">No filters used yet.</p>;
  return (
    <TableShell>
      <thead>
        <tr>
          <th className={th}>Filter</th>
          <th className={th}>Value</th>
          <th className={th}>Times used</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        {rows.map((row) => (
          <tr key={`${row.dimension}-${row.value}`}>
            <td className={td}>{DIMENSION_LABELS[row.dimension] ?? row.dimension}</td>
            <td className={td}>{row.dimension === "priceFilter" || row.dimension === "inStockOnly" ? "used" : row.value}</td>
            <td className={td}>{num(row.uses)}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
