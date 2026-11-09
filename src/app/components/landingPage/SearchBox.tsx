"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { useRecentSearches } from "@/src/hooks/useRecentSearches";
import { matchingRecents } from "@/src/utils/recentSearches";
import {
  getAutocompleteSuggestions,
  getTrendingSearches,
  isRequestCancelled,
} from "@/src/services/buyer/searchService";
import { AutocompleteSuggestion, TrendingTerm } from "@/src/types/buyer/search";

const MIN_QUERY_LENGTH = 2; // the API rejects shorter autocomplete queries
const MAX_QUERY_LENGTH = 100; // and longer ones

interface SearchBoxProps {
  /** Text to start with (e.g. the current ?q= on the results page). */
  initialQuery?: string;
}

interface DropdownItem {
  key: string;
  label: string;
  hint?: string;
  icon?: "search" | "trending" | "recent";
  /** Group heading shown above the first item of each section (empty-box view only). */
  section?: "recent" | "trending";
  /** Present on recent searches: forgets just this one. */
  onRemove?: () => void;
  onSelect: () => void;
}

export default function SearchBox({ initialQuery = "" }: SearchBoxProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [trending, setTrending] = useState<TrendingTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trendingLoaded = useRef(false);
  const { recent, add: rememberSearch, remove: forgetSearch, clear: clearRecent } = useRecentSearches();

  // Keep the box in sync when the URL's query changes (back/forward, a new search from another page).
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);
  // Close when the buyer clicks anywhere outside the search box.
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [close]);

  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const canSuggest = debouncedQuery.length >= MIN_QUERY_LENGTH && debouncedQuery.length <= MAX_QUERY_LENGTH;

  // One request per pause in typing; a newer keystroke cancels the request still in flight.
  useEffect(() => {
    if (!canSuggest) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    getAutocompleteSuggestions(debouncedQuery, 8, controller.signal)
      .then((result) => {
        setSuggestions(result);
        setActiveIndex(-1);
      })
      .catch((error) => {
        if (!isRequestCancelled(error)) setSuggestions([]); // suggestions are optional: fail quietly
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, canSuggest]);

  // Trending terms are shown when the box is focused and empty; fetched once.
  const loadTrending = useCallback(() => {
    if (trendingLoaded.current) return;
    trendingLoaded.current = true;
    getTrendingSearches(6)
      .then(setTrending)
      .catch(() => {
        trendingLoaded.current = false; // allow a retry on the next focus
      });
  }, []);

  const goToSearch = useCallback(
    (text: string) => {
      const trimmed = text.trim().slice(0, MAX_QUERY_LENGTH);
      if (trimmed) rememberSearch(trimmed); // only an actual search is remembered, never what was merely typed
      close();
      (document.activeElement as HTMLElement | null)?.blur?.();
      router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
    },
    [router, close, rememberSearch]
  );

  const trimmed = query.trim();
  const showingSuggestions = trimmed.length >= MIN_QUERY_LENGTH;

  const items: DropdownItem[] = showingSuggestions
    ? [
        {
          key: "search-for",
          label: `Search for “${trimmed}”`,
          icon: "search",
          onSelect: () => goToSearch(trimmed),
        },
        ...matchingRecents(recent, trimmed).map((term) => ({
          key: `recent-match-${term}`,
          label: term,
          icon: "recent" as const,
          onRemove: () => forgetSearch(term),
          onSelect: () => goToSearch(term),
        })),
        ...suggestions.map((s, index) => ({
          key: `${s.productId ?? s.suggestion}-${index}`,
          label: s.suggestion,
          hint: s.categoryName ?? undefined,
          onSelect: () => {
            rememberSearch(s.suggestion);
            close();
            router.push(s.productId ? `/product/${s.productId}` : `/search?q=${encodeURIComponent(s.suggestion)}`);
          },
        })),
      ]
    : [
        ...recent.map((term) => ({
          key: `recent-${term}`,
          label: term,
          icon: "recent" as const,
          section: "recent" as const,
          onRemove: () => forgetSearch(term),
          onSelect: () => goToSearch(term),
        })),
        // a trending term the buyer already has in their recents is not shown twice
        ...trending
          .filter((t) => !recent.some((term) => term.toLowerCase() === t.term.toLowerCase()))
          .map((t) => ({
            key: `trending-${t.rank}-${t.term}`,
            label: t.term,
            icon: "trending" as const,
            section: "trending" as const,
            onSelect: () => goToSearch(t.term),
          })),
      ];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && items.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex >= 0 && items[activeIndex]) {
        items[activeIndex].onSelect();
      } else {
        goToSearch(query);
      }
    } else if (event.key === "Delete" && activeIndex >= 0 && items[activeIndex]?.onRemove) {
      // only once the buyer has arrowed onto a recent search; otherwise Delete edits the text as usual
      event.preventDefault();
      items[activeIndex].onRemove?.();
      setActiveIndex(-1);
    } else if (event.key === "Escape") {
      close();
    }
  };

  const listId = "storefront-search-suggestions";
  const dropdownVisible = open && (items.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative w-[662px] max-w-full h-12">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5 pointer-events-none" />

      <input
        type="text"
        role="combobox"
        aria-expanded={dropdownVisible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search by molecule, Brand or therapeutic area"
        className="w-full h-full pl-12 pr-10 rounded-md bg-neutral-100 text-label-l3 focus:outline-none focus:ring-1 focus:ring-primary-600"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          if (query.trim().length === 0) loadTrending();
        }}
        onKeyDown={handleKeyDown}
      />

      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
      )}

      {dropdownVisible && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50 max-h-[360px] overflow-y-auto"
        >
          {items.map((item, index) => (
            <Fragment key={item.key}>
            {item.section && item.section !== items[index - 1]?.section && (
              <li role="presentation" className="flex items-center justify-between px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                <span>{item.section === "recent" ? "Recent searches" : "Trending searches"}</span>
                {item.section === "recent" && (
                  <button
                    type="button"
                    // mousedown so it runs before the input loses focus and the list closes
                    onMouseDown={(event) => {
                      event.preventDefault();
                      clearRecent();
                    }}
                    className="normal-case font-medium text-primary-700 hover:text-primary-900"
                  >
                    Clear
                  </button>
                )}
              </li>
            )}
            <li
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown (not click) so it fires before the input loses focus and the list closes
              onMouseDown={(event) => {
                event.preventDefault();
                item.onSelect();
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-center justify-between gap-3 px-4 py-2 cursor-pointer text-sm ${
                index === activeIndex ? "bg-primary-50 text-primary-800" : "text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {item.icon === "search" && <Search size={14} className="shrink-0 text-neutral-400" />}
                {item.icon === "trending" && <TrendingUp size={14} className="shrink-0 text-neutral-400" />}
                {item.icon === "recent" && <Clock size={14} className="shrink-0 text-neutral-400" />}
                <span className="truncate">{item.label}</span>
              </span>
              {item.onRemove ? (
                <button
                  type="button"
                  aria-label={`Remove ${item.label} from recent searches`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation(); // don't also run the row's own search
                    item.onRemove?.();
                  }}
                  className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                >
                  <X size={14} />
                </button>
              ) : (
                item.hint && <span className="shrink-0 text-xs text-neutral-400">{item.hint}</span>
              )}
            </li>
            </Fragment>
          ))}
          {showingSuggestions && !loading && suggestions.length === 0 && (
            <li className="px-4 py-2 text-xs text-neutral-400">No product suggestions — press Enter to search</li>
          )}
        </ul>
      )}
    </div>
  );
}
