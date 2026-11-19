// Shapes of the search-service analytics reports (GET /search/analytics/**), as passed through by
// app/api/search-analytics/[report]/route.ts.

export interface TermStats {
  term: string;
  searches: number;
  avgResults: number;
  zeroResultSearches: number;
  searchesWithClick: number;
  /** 0..1 */
  clickThroughRate: number;
}

export interface ProductStats {
  productId: string;
  productName: string | null;
  manufacturerName: string | null;
  clicks: number;
  addToCarts: number;
  quoteRequests: number;
  orders: number;
  /** Zero-based average rank of the clicks; low means the product is found near the top. */
  avgClickPosition: number | null;
}

export interface Funnel {
  days: number;
  searches: number;
  zeroResultSearches: number;
  searchesWithClick: number;
  searchesWithAddToCart: number;
  searchesWithQuote: number;
  searchesWithOrder: number;
  clicks: number;
  addToCarts: number;
  quoteRequests: number;
  orders: number;
  avgClickPosition: number | null;
  /** all rates are 0..1 of searches */
  zeroResultRate: number;
  clickThroughRate: number;
  addToCartRate: number;
  quoteRate: number;
  orderRate: number;
}

export interface FilterUsage {
  dimension: string;
  value: string;
  uses: number;
}

export type AnalyticsReport = "top-terms" | "zero-results" | "top-products" | "funnel" | "filters";
