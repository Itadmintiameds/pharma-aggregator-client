// Pure logic for the buyer's "recent searches" list (stored in the browser only - see useRecentSearches).
// No React or browser APIs in here so it can be exercised on its own.

export const RECENT_SEARCHES_KEY = "tiameds.recentSearches.v1";
export const MAX_RECENT_SEARCHES = 8;
/** Same limit the search API enforces on `q`. */
export const MAX_RECENT_TERM_LENGTH = 100;

/** Trim, collapse inner whitespace and cap the length. Returns "" for anything not worth remembering. */
export function normalizeTerm(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_RECENT_TERM_LENGTH);
}

const sameTerm = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** New list with `term` first (most recent), any earlier copy of it (case-insensitive) removed, capped in size. */
export function addRecent(list: readonly string[], rawTerm: string): string[] {
  const term = normalizeTerm(rawTerm);
  if (!term) return [...list];
  return [term, ...list.filter((existing) => !sameTerm(existing, term))].slice(0, MAX_RECENT_SEARCHES);
}

export function removeRecent(list: readonly string[], rawTerm: string): string[] {
  const term = normalizeTerm(rawTerm);
  return list.filter((existing) => !sameTerm(existing, term));
}

/** Reads whatever is in storage defensively: corrupt JSON, wrong types or an oversized list never throw. */
export function parseStored(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned: string[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "string") continue;
      const term = normalizeTerm(entry);
      if (term && !cleaned.some((existing) => sameTerm(existing, term))) cleaned.push(term);
    }
    return cleaned.slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** Recent terms that contain what the buyer is typing (but are not exactly it), for the dropdown while typing. */
export function matchingRecents(list: readonly string[], typed: string, limit = 3): string[] {
  const needle = normalizeTerm(typed).toLowerCase();
  if (!needle) return [];
  return list.filter((term) => term.toLowerCase().includes(needle) && term.toLowerCase() !== needle).slice(0, limit);
}
