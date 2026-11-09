import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Server-side bridge to the search service's analytics reports (GET /search/analytics/**).
//
// Those reports are internal: the search service demands X-Internal-Api-Key and the gateway blocks them. The key
// must never reach a browser, so the browser calls THIS route, which adds the key on the server and passes the
// answer through. Nothing here is user-specific and no buyer data is involved (the events are anonymous).
//
// Access: the platform has no admin login yet, so this is how it is gated for now:
//   - ANALYTICS_VIEW_TOKEN set  -> the caller must send it (header x-analytics-token); the page asks for it.
//   - not set, development      -> open (so it can be looked at straight away on a developer machine).
//   - not set, production       -> closed (403) until a token is configured - never open by accident.
// Replace this with real admin authentication when the admin dashboard exists.

const REPORTS = new Set(["top-terms", "zero-results", "top-products", "funnel", "filters"]);

function accessDenied(request: NextRequest): NextResponse | null {
  const token = process.env.ANALYTICS_VIEW_TOKEN;
  if (token) {
    const given = Buffer.from(request.headers.get("x-analytics-token") ?? "");
    const expected = Buffer.from(token);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return NextResponse.json({ error: "A valid analytics token is required.", tokenRequired: true }, { status: 401 });
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Analytics is closed in production until ANALYTICS_VIEW_TOKEN is configured.", tokenRequired: false },
      { status: 403 }
    );
  }
  return null;
}

function intParam(value: string | null, min: number, max: number): number | null | "invalid" {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : "invalid";
}

export async function GET(request: NextRequest, context: { params: Promise<{ report: string }> }) {
  const denied = accessDenied(request);
  if (denied) return denied;

  const { report } = await context.params;
  if (!REPORTS.has(report)) {
    return NextResponse.json({ error: "Unknown report." }, { status: 404 });
  }

  const days = intParam(request.nextUrl.searchParams.get("days"), 1, 90);
  const limit = intParam(request.nextUrl.searchParams.get("limit"), 1, 100);
  if (days === "invalid" || limit === "invalid") {
    return NextResponse.json({ error: "days must be 1-90 and limit 1-100." }, { status: 400 });
  }

  const key = process.env.SEARCH_INTERNAL_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "SEARCH_INTERNAL_API_KEY is not configured for the storefront server." },
      { status: 500 }
    );
  }

  const base = (process.env.SEARCH_SERVICE_URL ?? "http://localhost:8086").replace(/\/+$/, "");
  const query = new URLSearchParams();
  if (days !== null) query.set("days", String(days));
  if (limit !== null) query.set("limit", String(limit));

  try {
    const upstream = await fetch(`${base}/search/analytics/${report}?${query}`, {
      headers: { "X-Internal-Api-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (upstream.status === 404) {
      return NextResponse.json(
        { error: "The search service has no analytics endpoints yet - restart it on the latest build." },
        { status: 502 }
      );
    }
    if (upstream.status === 401) {
      return NextResponse.json(
        { error: "The search service rejected the internal key (SEARCH_INTERNAL_API_KEY differs from its own)." },
        { status: 502 }
      );
    }

    const body = (await upstream.json().catch(() => null)) as { data?: unknown; message?: string } | null;
    // A search service built before the analytics existed answers an unknown path with a 500 "No static resource ..."
    // (newer builds return a proper 404, handled above). Either way the fix is the same, so say it plainly.
    if (!upstream.ok && body?.message?.includes("No static resource")) {
      return NextResponse.json(
        { error: "The search service is running an older build without the analytics endpoints - restart it on the latest code." },
        { status: 502 }
      );
    }
    if (!upstream.ok) {
      return NextResponse.json({ error: body?.message ?? "The search service could not produce this report." }, { status: 502 });
    }
    return NextResponse.json({ data: body?.data ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not reach the search service." }, { status: 502 });
  }
}
