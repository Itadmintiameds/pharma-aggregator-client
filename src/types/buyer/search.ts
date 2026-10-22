// Shapes returned by the search service (via the gateway at /api/v1/search/**).
// Mirrors search-service's ProductResultDto / SearchResultDto / FacetDto / AutocompleteSuggestionDto.

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "newest";

export interface SearchParams {
  /** Free text. Leave empty to browse (all buyable products, filtered/sorted as requested). */
  q?: string;
  categoryId?: string | number;
  therapeuticCategory?: string;
  dosageForm?: string;
  packType?: string;
  /** Exact manufacturer name, as listed in the manufacturerName facet. */
  manufacturerName?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  sellerId?: string;
  /** Zero-based. The API rejects page * size > 10,000. */
  page?: number;
  /** 1..100 */
  size?: number;
  sort?: SearchSort;
}

export interface SearchProductResult {
  productId: string;
  productName: string;
  manufacturerName?: string | null;
  productDescription?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  mrp?: number | null;
  sellingPrice?: number | null;
  discountPercentage?: number | null;
  /** The batch the headline price comes from, and its packaging variant (needed to order). */
  pricingId?: string | null;
  packagingId?: string | null;
  imageUrl?: string | null;
  stockQuantity?: number | null;
  minOrderQty?: number | null;
  maxOrderQty?: number | null;
  inStock: boolean;
  relevanceScore: number;
}

export interface SearchFacetValue {
  value: string;
  count: number;
}

export interface SearchFacet {
  /** categoryName | therapeuticCategory | dosageForm | packType | manufacturerName */
  field: string;
  values: SearchFacetValue[];
}

export interface SearchResultPage {
  /** Identifies this search; echoed back with the actions that follow it (see searchEvents.ts). */
  searchId?: string;
  results: SearchProductResult[];
  facets: SearchFacet[];
  page: number;
  size: number;
  totalResults: number;
  totalPages: number;
}

export interface AutocompleteSuggestion {
  suggestion: string;
  productId?: string | null;
  categoryName?: string | null;
}

export interface TrendingTerm {
  term: string;
  searchCount: number;
  rank: number;
}
