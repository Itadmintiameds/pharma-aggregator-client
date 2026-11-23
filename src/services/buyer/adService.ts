import buyerApi from "@/src/lib/buyerApi";
import { AdBanner } from "@/src/types/buyer/ads";

/** Live cards for the landing page strip (public, no token). Failure just means "no ads". */
export async function getLiveAds(signal?: AbortSignal): Promise<AdBanner[]> {
  const response = await buyerApi.get("/ads", { signal, skipAuthRedirect: true });
  const data = response.data?.data;
  return Array.isArray(data) ? (data as AdBanner[]) : [];
}

/**
 * Counts a click. Fire-and-forget and keepalive so it still goes out when the click navigates away;
 * a body-less POST with no custom headers is a "simple" CORS request, so there is no preflight.
 */
export function trackAdClick(id: number): void {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return;
  try {
    void fetch(`${base}/ads/${id}/click`, { method: "POST", keepalive: true }).catch(() => undefined);
  } catch {
    /* analytics must never break the click */
  }
}
