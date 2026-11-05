"use client";

import { useEffect, useState } from "react";

/**
 * "Now" according to the server's clock, re-rendering every `intervalMs` while `enabled`.
 * `offsetMs` is server-minus-browser (see clockOffsetMs). When disabled it does not tick, so pages
 * without offers pay nothing for it.
 */
export function useServerNow(offsetMs: number, enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now() + offsetMs);

  useEffect(() => {
    const update = () => setNow(Date.now() + offsetMs);
    // Re-sync right away when the offset changes (the product has just loaded), without waiting a full tick.
    const first = setTimeout(update, 0);
    if (!enabled) return () => clearTimeout(first);
    const timer = setInterval(update, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [offsetMs, enabled, intervalMs]);

  return now;
}
