import { useCallback, useSyncExternalStore } from "react";
import {
  RECENT_SEARCHES_KEY,
  addRecent,
  parseStored,
  removeRecent,
} from "@/src/utils/recentSearches";

// The buyer's recent searches live in this browser only (localStorage): nothing is sent to a server, so a visitor
// who is not logged in gets history without anything being stored about them, and clearing site data clears it.
// A server-side history for logged-in buyers would be a separate feature (needs the buyer id and a retention policy).

const CHANGED_EVENT = "recent-searches-changed";
const EMPTY: string[] = [];

// useSyncExternalStore needs a snapshot whose identity only changes when the data does.
let cachedRaw: string | null = null;
let cachedList: string[] = EMPTY;

function readSnapshot(): string[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(RECENT_SEARCHES_KEY);
  } catch {
    return EMPTY; // storage blocked (some private modes / policies): behave as "no history"
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseStored(raw);
  }
  return cachedList;
}

function writeList(list: string[]) {
  try {
    if (list.length > 0) localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // quota exceeded or storage blocked: history just isn't remembered
  }
  window.dispatchEvent(new Event(CHANGED_EVENT)); // same-tab listeners (the native "storage" event is cross-tab only)
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange); // another tab changed it
  return () => {
    window.removeEventListener(CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useRecentSearches() {
  // Server render and first hydration see an empty list, so a prerendered page never mismatches.
  const recent = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY);

  const add = useCallback((term: string) => writeList(addRecent(readSnapshot(), term)), []);
  const remove = useCallback((term: string) => writeList(removeRecent(readSnapshot(), term)), []);
  const clear = useCallback(() => writeList([]), []);

  return { recent, add, remove, clear };
}
