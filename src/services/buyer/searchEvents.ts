import buyerApi from "@/src/lib/buyerApi";

// Reports what a buyer does with search results (click, add to cart, quote request, order) to the search service
// so the business can see which searches and products actually lead somewhere (POST /search/events).
//
// Everything here is fire-and-forget and anonymous: no buyer id is sent, only the id of the search the buyer was
// shown and a random per-browser-session id. Analytics must never break or slow the storefront, so every failure
// is swallowed. The search context (which search showed which product) is kept in sessionStorage so an add-to-cart
// or order that happens a few pages later can still be tied to the search that found the product.

export type SearchActionType = "SEARCH_CLICK" | "ADD_TO_CART" | "QUOTE_REQUEST" | "ORDER";

export interface SearchContext {
  searchId: string;
  /** Zero-based rank of the product in the list the buyer saw. */
  position: number;
}

const CONTEXT_KEY = "tiameds.searchContext.v1";
const SESSION_KEY = "tiameds.searchSessionId.v1";
/** A search context older than this is not used to attribute actions (the buyer has moved on). */
const CONTEXT_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_REMEMBERED_PRODUCTS = 50;

type StoredContext = SearchContext & { at: number };

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined; // storage blocked: events are still sent, just without a session id
  }
}

function readContexts(): Record<string, StoredContext> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, StoredContext>) : {};
  } catch {
    return {};
  }
}

/** Remember that `productId` was shown by search `searchId` (so later actions can be attributed to it). */
export function rememberSearchContext(productId: string, context: SearchContext): void {
  try {
    const contexts = readContexts();
    contexts[productId] = { ...context, at: Date.now() };
    // keep the newest entries only
    const newest = Object.entries(contexts)
      .sort(([, a], [, b]) => b.at - a.at)
      .slice(0, MAX_REMEMBERED_PRODUCTS);
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(Object.fromEntries(newest)));
  } catch {
    // storage blocked or full: attribution just won't carry across pages
  }
}

export function getSearchContext(productId: string): SearchContext | null {
  const stored = readContexts()[productId];
  if (!stored || typeof stored.searchId !== "string" || Date.now() - stored.at > CONTEXT_MAX_AGE_MS) return null;
  return { searchId: stored.searchId, position: stored.position };
}

/** Report an action for a product against a known search. No-op without a search context. Never throws. */
export function trackSearchEvent(type: SearchActionType, productId: string, context: SearchContext | null | undefined): void {
  if (!context?.searchId || !productId) return;
  buyerApi
    .post(
      "/search/events",
      {
        eventId: randomId(), // makes a retry harmless on the server
        searchId: context.searchId,
        type,
        productId,
        position: Number.isFinite(context.position) ? Math.max(0, Math.round(context.position)) : undefined,
        sessionId: sessionId(),
      },
      { skipAuthRedirect: true }
    )
    .catch(() => {
      // analytics only: ignore
    });
}

/** Report an action using the search context remembered for this product (e.g. a quote or order made later). */
export function trackFromRememberedSearch(type: SearchActionType, productId: string): void {
  trackSearchEvent(type, productId, getSearchContext(productId));
}
