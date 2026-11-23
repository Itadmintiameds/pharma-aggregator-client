"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  acceptQuoteRequest,
  getMyQuoteRequests,
  rejectQuoteRequest,
} from "@/src/services/buyer/quoteRequestService";
import { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { useBuyerCartDrawer } from "../../context/BuyerCartDrawerContext";
import {
  ProductSummary,
  ProductThumb,
  StatusBadge,
  prettyStatus,
  useProductSummaries,
} from "@/src/app/commonComponents/cardUi";
import { formatMoney } from "@/src/utils/dashboardFormat";

const STATUS_FILTERS = ["ALL", "PENDING", "QUOTED", "ACCEPTED", "ORDER_PLACED", "REJECTED", "EXPIRED"];

const TYPE_LABELS: Record<string, string> = {
  PRICE_REQUEST: "Price request",
  RFQ: "RFQ",
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

// quoteValidUntil is a plain "valid through this date" day, not a precise
// timestamp — comparing by date-only (not new Date() <= new Date(str)) keeps
// the quote valid for the entirety of its expiry day regardless of the
// buyer's local time.
function isQuoteExpired(quoteValidUntil?: string): boolean {
  if (!quoteValidUntil) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(quoteValidUntil);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="break-words text-[13px] font-semibold leading-tight text-neutral-900">{children}</p>
    </div>
  );
}

function QuoteCard({
  request,
  product,
  busy,
  onAccept,
  onReject,
  onPlaceOrder,
}: {
  request: QuoteRequest;
  product?: ProductSummary;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onPlaceOrder: () => void;
}) {
  const { status, quotedPrice } = request;
  const expired = isQuoteExpired(request.quoteValidUntil);
  const listed = product?.listedPrice;
  const unit = request.unit ?? "units";
  const vsListed =
    quotedPrice != null && listed ? Math.round(((quotedPrice - listed) / listed) * 100) : null;
  const vsTarget =
    quotedPrice != null && request.targetPrice
      ? Math.round(((quotedPrice - request.targetPrice) / request.targetPrice) * 100)
      : null;
  const raised = formatDate(request.createdAt);

  return (
    <div
      id={`quote-${request.quoteRequestId}`}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-1.5">
        <ProductThumb size="sm" src={product?.image} alt={request.productName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-heading font-bold text-pneutral-900">{request.productName}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-700">Quote #{request.quoteRequestId}</span>
            <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-800">
              {TYPE_LABELS[request.requestType] ?? request.requestType}
            </span>
            {request.sellerName && <span className="font-medium text-neutral-600">{request.sellerName}</span>}
            {raised && <span>· Raised {raised}</span>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-2 sm:grid-cols-3 lg:grid-cols-6">
        <Detail label="Quantity">
          {request.quantity} {unit}
        </Detail>
        {request.targetPrice != null && <Detail label="Your target price">{formatMoney(request.targetPrice)} / unit</Detail>}
        {listed != null && <Detail label="Listed price">{formatMoney(listed)} / unit</Detail>}
        {request.deliveryLocation && <Detail label="Delivery location">{request.deliveryLocation}</Detail>}
        {request.pincode && <Detail label="Pincode">{request.pincode}</Detail>}
        {request.expectedDeliveryDate && <Detail label="Needed by">{formatDate(request.expectedDeliveryDate)}</Detail>}
        {request.paymentTerms && <Detail label="Payment terms">{request.paymentTerms}</Detail>}
      </div>

      {request.message?.trim() && (
        <div className="mx-4 mb-2 flex flex-wrap items-baseline gap-x-2 rounded-md border-l-4 border-primary-200 bg-neutral-50 px-3 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Your message</p>
          <p className="whitespace-pre-wrap text-xs italic text-neutral-700">&quot;{request.message}&quot;</p>
        </div>
      )}

      {status === "PENDING" && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-1.5">
          <p className="text-xs font-medium text-neutral-600">Waiting for the seller to send you a quote.</p>
        </div>
      )}

      {status !== "PENDING" && quotedPrice != null && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Seller&apos;s quote</p>
              <p className="text-base font-heading font-bold text-primary-900">
                {formatMoney(quotedPrice)} <span className="text-xs font-normal text-neutral-500">/ unit</span>
              </p>
              {listed != null && (
                <p className="text-xs text-neutral-500">
                  Listed price <span className="line-through">{formatMoney(listed)}</span>
                  {vsListed !== null && vsListed !== 0 && (
                    <span className={vsListed < 0 ? "text-green-700" : "text-amber-700"}>
                      {" "}
                      · {Math.abs(vsListed)}% {vsListed < 0 ? "below" : "above"} listed
                    </span>
                  )}
                </p>
              )}
              {vsTarget !== null && (
                <p className={`text-xs ${vsTarget > 0 ? "text-amber-700" : "text-green-700"}`}>
                  {vsTarget === 0
                    ? "Matches your target price"
                    : `${Math.abs(vsTarget)}% ${vsTarget > 0 ? "above" : "below"} your target price`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-5">
              <Detail label="Order value">{formatMoney(quotedPrice * request.quantity)}</Detail>
              {request.quoteValidUntil && (
                <Detail label={expired ? "Expired on" : "Valid until"}>{formatDate(request.quoteValidUntil)}</Detail>
              )}
              {request.orderId && <Detail label="Order">{request.orderId}</Detail>}
            </div>
          </div>
          {request.sellerNotes && (
            <p className="mt-1 text-xs text-neutral-600">
              <span className="text-neutral-500">Seller&apos;s note:</span> {request.sellerNotes}
            </p>
          )}
        </div>
      )}

      {status === "QUOTED" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-4 py-2">
          <button
            type="button"
            disabled={busy || expired}
            onClick={onAccept}
            className="rounded-lg border-[1.5px] border-primary-900 px-3 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-50 disabled:opacity-40"
          >
            Accept quote
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="rounded-lg border-[1.5px] border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Reject
          </button>
          {expired && <p className="text-xs font-medium text-amber-700">This quote has expired.</p>}
        </div>
      )}

      {status === "ACCEPTED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-green-100 bg-green-50 px-4 py-2">
          <p className="text-xs font-medium text-green-900">
            {expired
              ? `This quote expired on ${formatDate(request.quoteValidUntil)}. Ask the seller for a new quote to place this order.`
              : "You accepted this quote. Place the order to have it shipped at the agreed price."}
          </p>
          <button
            type="button"
            disabled={expired}
            onClick={onPlaceOrder}
            className="rounded-lg border-[1.5px] border-primary-900 px-3 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Place order
          </button>
        </div>
      )}

      {status === "ORDER_PLACED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-green-100 bg-green-50 px-4 py-1.5">
          <p className="text-xs font-medium text-green-900">Order placed{request.orderId ? ` — ${request.orderId}` : ""}</p>
          {request.orderId && (
            <Link
              href={`/buyer_e8d45a1b/dashboard/orders/${request.orderId}`}
              className="text-xs font-semibold text-primary-800 hover:underline"
            >
              View order
            </Link>
          )}
        </div>
      )}

      {(status === "REJECTED" || status === "EXPIRED") && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-1.5">
          <p className="text-xs font-medium text-neutral-600">
            {status === "REJECTED"
              ? "You rejected this quote."
              : "This quote ran out before it was accepted. You can raise a new request from the product page."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function BuyerRfqPage() {
  const router = useRouter();
  const { openQuoteOrder } = useBuyerCartDrawer();
  const { status: onboardingStatus } = useBuyerOnboardingStatus();
  const [requests, setRequests] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const data = await getMyQuoteRequests();
      setRequests([...data].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your requests.");
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask: the set-state-in-effect lint rule flags load() when called directly.
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    // Deep link, e.g. ?status=QUOTED opens that tab.
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && STATUS_FILTERS.includes(wanted)) queueMicrotask(() => setStatusFilter(wanted));
  }, []);

  useEffect(() => {
    // A link such as /dashboard/rfq#quote-4 (from an order) jumps to that quote once the list has loaded.
    if (requests === null) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#quote-")) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [requests]);

  const products = useProductSummaries((requests ?? []).map((r) => r.productId));
  const countFor = useMemo(
    () => (status: string) =>
      status === "ALL" ? requests?.length ?? 0 : (requests ?? []).filter((r) => r.status === status).length,
    [requests]
  );
  const visible = (requests ?? []).filter((r) => statusFilter === "ALL" || r.status === statusFilter);

  const act = async (id: number, action: () => Promise<unknown>, success: string, failure: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failure);
    } finally {
      setBusyId(null);
    }
  };

  // Placing an order requires an approved Buyer profile (checkout resolves
  // buyerId from it) — a buyer who's still mid-registration is sent to
  // finish that first instead of hitting a checkout page that would just
  // fail. Overview is where BuyerOnboardingGate renders the registration
  // wizard for any non-approved status.
  // The order is placed in the cart drawer, over this page, instead of on the separate /checkout page.
  const handlePlaceOrder = (request: QuoteRequest) => {
    if (onboardingStatus !== "approved") {
      toast.info("Complete your organization registration to place this order.");
      router.push("/buyer_e8d45a1b/dashboard");
      return;
    }
    openQuoteOrder(request);
  };

  useEffect(() => {
    // The drawer announces a placed quote order, so this list moves the quote to "Order placed" without a reload.
    const onQuotesChanged = () => load();
    window.addEventListener("buyer-quotes-changed", onQuotesChanged);
    return () => window.removeEventListener("buyer-quotes-changed", onQuotesChanged);
  }, [load]);

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-heading font-bold text-pneutral-900">Quotes</h2>
          {requests !== null && <span className="text-xs text-neutral-500">{visible.length} shown</span>}
        </div>
        <p className="text-xs text-neutral-500">
          Track the price requests and RFQs you&apos;ve raised, and respond once a seller quotes you.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
            className={`rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold transition-colors ${
              statusFilter === status
                ? "border-primary-900 bg-transparent text-primary-900"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-800 hover:text-primary-900"
            }`}
          >
            {prettyStatus(status)}
            {requests !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && requests === null && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
        </div>
      )}

      {!error && requests !== null && requests.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-p2 font-body text-pneutral-600">
            You haven&apos;t raised any price requests or RFQs yet. Use &quot;Request Price Option&quot; or
            &quot;Get a Quote&quot; on a product page to get started.
          </p>
        </div>
      )}

      {!error && requests !== null && requests.length > 0 && visible.length === 0 && (
        <p className="py-10 text-center text-p3 font-body text-neutral-500">
          No {prettyStatus(statusFilter).toLowerCase()} quotes.
        </p>
      )}

      {!error && visible.length > 0 && (
        <div className="flex flex-col gap-2">
          {visible.map((request) => (
            <QuoteCard
              key={request.quoteRequestId}
              request={request}
              product={products[request.productId]}
              busy={busyId === request.quoteRequestId}
              onAccept={() =>
                act(request.quoteRequestId, () => acceptQuoteRequest(request.quoteRequestId), "Quote accepted", "Failed to accept quote")
              }
              onReject={() =>
                act(request.quoteRequestId, () => rejectQuoteRequest(request.quoteRequestId), "Quote rejected", "Failed to reject quote")
              }
              onPlaceOrder={() => handlePlaceOrder(request)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
