"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLiveAds, trackAdClick } from "@/src/services/buyer/adService";
import { AdBanner } from "@/src/types/buyer/ads";

/** Auto-scroll speed in px/second: slow enough to read a card as it passes. */
const SPEED_PX_PER_SECOND = 40;

/** One image card. Same-site targets use client-side navigation; others open as a normal link. */
export function AdCard({ ad, onClick }: { ad: AdBanner; onClick?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const external = !ad.targetUrl.startsWith("/");
  const newTab = Boolean(ad.openInNewTab);

  const body = (
    <>
      {!imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt=""
          draggable={false}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {ad.badgeText && (
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-900">
          {ad.badgeText}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-tight text-white">{ad.title}</h3>
          {ad.subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-white/85">{ad.subtitle}</p>}
        </div>
        {ad.buttonText && (
          <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary-900 transition-colors group-hover:bg-primary-50">
            {ad.buttonText}
          </span>
        )}
      </div>
    </>
  );

  const className =
    "group relative block h-40 w-[280px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 to-primary-600 no-underline shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-lg hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 sm:h-44 sm:w-[320px]";
  const label = `${ad.title}${ad.subtitle ? ` - ${ad.subtitle}` : ""}`;

  if (external || newTab) {
    return (
      <a
        href={ad.targetUrl}
        target={newTab ? "_blank" : undefined}
        rel={newTab || external ? "noopener noreferrer" : undefined}
        aria-label={label}
        onClick={onClick}
        className={className}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={ad.targetUrl} aria-label={label} onClick={onClick} className={className}>
      {body}
    </Link>
  );
}

function AdSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 w-[280px] shrink-0 animate-pulse rounded-2xl bg-gray-200 sm:h-44 sm:w-[320px]" />
      ))}
    </div>
  );
}

/**
 * Landing page strip of admin-managed ad cards that scrolls sideways by itself. It pauses while the
 * pointer/focus is on it or the visitor is scrolling by hand, scrolls natively (touch/trackpad/arrows) and
 * loops seamlessly when there are more cards than fit. Renders nothing when there are no live ads.
 */
export default function AdCarousel() {
  const [ads, setAds] = useState<AdBanner[] | null>(null);
  const [looping, setLooping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const position = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    getLiveAds(controller.signal)
      .then(setAds)
      .catch(() => {
        if (!controller.signal.aborted) setAds([]);
      });
    return () => controller.abort();
  }, []);

  const hasAds = Boolean(ads && ads.length > 0);

  // Decide whether the cards overflow (then clone them for a seamless loop) and keep that up to date on resize.
  useEffect(() => {
    const container = scroller.current;
    const set = firstSet.current;
    if (!container || !set) return;
    const measure = () => setLooping(set.offsetWidth > container.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(set);
    return () => observer.disconnect();
  }, [hasAds]);

  // The auto-scroll loop.
  useEffect(() => {
    const container = scroller.current;
    const set = firstSet.current;
    if (!looping || !container || !set) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    const gap = parseFloat(getComputedStyle(container.firstElementChild as Element).columnGap) || 0;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000; // clamp so a background-tab gap does not jump the strip
      last = now;
      if (!paused.current) {
        const loopWidth = set.offsetWidth + gap;
        position.current += SPEED_PX_PER_SECOND * dt;
        if (position.current >= loopWidth) position.current -= loopWidth;
        container.scrollLeft = position.current;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [looping, ads]);

  if (ads === null) {
    return (
      <section aria-label="Featured deals" className="py-4">
        <AdSkeleton />
      </section>
    );
  }
  if (ads.length === 0) return null;

  // While the visitor drives the scroll (touch, trackpad, arrows) adopt their position so auto-scroll resumes from there.
  const syncPosition = () => {
    if (paused.current && scroller.current) position.current = scroller.current.scrollLeft;
  };
  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    if (scroller.current) position.current = scroller.current.scrollLeft;
    paused.current = false;
  };
  // After a touch swipe the browser keeps gliding for a moment; resume only once that has settled.
  const resumeLater = () => {
    window.setTimeout(resume, 1500);
  };
  const nudge = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
    // scrollLeft is clamped at 0 so going back from the very start would stall; wrap to the clone end instead.
    if (looping && dir === -1 && el.scrollLeft < el.clientWidth * 0.7 && firstSet.current) {
      el.scrollLeft += firstSet.current.offsetWidth;
      el.scrollBy({ left: -el.clientWidth * 0.7, behavior: "smooth" });
    }
  };

  const renderSet = (hidden: boolean) => (
    <div
      ref={hidden ? undefined : firstSet}
      aria-hidden={hidden || undefined}
      className="flex shrink-0 gap-4"
    >
      {ads.map((ad) => (
        <AdCard key={`${hidden ? "c" : "a"}-${ad.id}`} ad={ad} onClick={() => trackAdClick(ad.id)} />
      ))}
    </div>
  );

  return (
    <section aria-label="Featured deals" className="py-4">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Featured Deals</h2>
        {looping && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Scroll deals left"
              onClick={() => nudge(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:border-primary-700 hover:text-primary-700"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Scroll deals right"
              onClick={() => nudge(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:border-primary-700 hover:text-primary-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scroller}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        onTouchStart={pause}
        onTouchEnd={resumeLater}
        onScroll={syncPosition}
        className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-4 pb-1">
          {renderSet(false)}
          {looping && renderSet(true)}
        </div>
      </div>
    </section>
  );
}
