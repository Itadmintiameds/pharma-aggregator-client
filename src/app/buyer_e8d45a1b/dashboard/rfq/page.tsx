"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import {
  acceptQuoteRequest,
  getMyQuoteRequests,
  rejectQuoteRequest,
} from "@/src/services/buyer/quoteRequestService";
import { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-info-50 text-info-600",
  QUOTED: "bg-warning-50 text-warning-600",
  ACCEPTED: "bg-success-50 text-success-600",
  REJECTED: "bg-red-50 text-red-500",
  EXPIRED: "bg-neutral-100 text-neutral-600",
  ORDER_PLACED: "bg-success-50 text-success-600",
};

const TYPE_LABELS: Record<string, string> = {
  PRICE_REQUEST: "Price Request",
  RFQ: "RFQ",
};

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

export default function BuyerRfqPage() {
  const router = useRouter();
  const { status: onboardingStatus } = useBuyerOnboardingStatus();
  const [requests, setRequests] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyQuoteRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your requests.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (quoteRequestId: number) => {
    setBusyId(quoteRequestId);
    try {
      await acceptQuoteRequest(quoteRequestId);
      toast.success("Quote accepted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept quote");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (quoteRequestId: number) => {
    setBusyId(quoteRequestId);
    try {
      await rejectQuoteRequest(quoteRequestId);
      toast.success("Quote rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject quote");
    } finally {
      setBusyId(null);
    }
  };

  // Placing an order requires an approved Buyer profile (checkout resolves
  // buyerId from it) — a buyer who's still mid-registration is sent to
  // finish that first instead of hitting a checkout page that would just
  // fail. Overview is where BuyerOnboardingGate renders the registration
  // wizard for any non-approved status.
  const handlePlaceOrder = (quoteRequestId: number) => {
    if (onboardingStatus !== "approved") {
      toast.info("Complete your organization registration to place this order.");
      router.push("/buyer_e8d45a1b/dashboard");
      return;
    }
    router.push(`/checkout?quoteRequestId=${quoteRequestId}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">RFQ & Quotes</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Track the price requests and RFQs you&apos;ve raised, and respond once a seller quotes you.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && requests === null && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {!error && requests !== null && requests.length === 0 && (
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-12 text-center">
          <p className="text-p2 font-body text-pneutral-600">
            You haven&apos;t raised any price requests or RFQs yet. Use &quot;Request Price Option&quot; or
            &quot;Get a Quote&quot; on a product page to get started.
          </p>
        </div>
      )}

      {!error && requests !== null && requests.length > 0 && (
        <div className="flex flex-col gap-4">
          {requests.map((request) => {
            const isExpanded = expandedId === request.quoteRequestId;
            const hasMessage = !!request.message?.trim();
            return (
            <div key={request.quoteRequestId} className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-p2 font-heading font-semibold text-pneutral-900">{request.productName}</p>
                  <p className="text-p4 font-body text-pneutral-600">
                    {TYPE_LABELS[request.requestType] ?? request.requestType} • Seller: {request.sellerName}
                  </p>
                </div>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-label-l2 font-heading font-medium shrink-0 ${
                    STATUS_STYLES[request.status] ?? "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : request.quoteRequestId)}
                className="flex items-center gap-1.5 text-p4 font-heading font-medium text-pneutral-700 hover:text-primary-800 mt-3"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
                {isExpanded ? "Hide details" : "Show details"}
              </button>

              {isExpanded && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-p4 font-body text-pneutral-600 mb-3">
                    <div>
                      <p className="text-pneutral-400">Quantity</p>
                      <p className="text-pneutral-900">{request.quantity} {request.unit}</p>
                    </div>
                    {request.targetPrice != null && (
                      <div>
                        <p className="text-pneutral-400">Your target price</p>
                        <p className="text-pneutral-900">₹{request.targetPrice}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-pneutral-400">Raised on</p>
                      <p className="text-pneutral-900">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {hasMessage && (
                    <div>
                      <p className="text-pneutral-400 text-p4 font-body">Your message</p>
                      <p className="text-p4 font-body text-pneutral-600 whitespace-pre-wrap">{request.message}</p>
                    </div>
                  )}
                </div>
              )}

              {request.status === "QUOTED" && (
                <div className="bg-warning-50 rounded-xl p-4 mt-3">
                  <p className="text-p3 font-heading font-semibold text-pneutral-900 mb-1">
                    Seller quoted ₹{request.quotedPrice}
                    {request.quoteValidUntil && ` (valid until ${new Date(request.quoteValidUntil).toLocaleDateString()})`}
                  </p>
                  {request.sellerNotes && (
                    <p className="text-p4 font-body text-pneutral-700">{request.sellerNotes}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={busyId === request.quoteRequestId}
                      onClick={() => handleAccept(request.quoteRequestId)}
                      className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busyId === request.quoteRequestId}
                      onClick={() => handleReject(request.quoteRequestId)}
                      className="border border-red-500 text-red-600 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {request.status === "ACCEPTED" && (() => {
                const expired = isQuoteExpired(request.quoteValidUntil);
                return (
                  <div className="bg-success-50 rounded-xl p-4 mt-3">
                    <p className="text-p3 font-heading font-semibold text-pneutral-900 mb-1">
                      You accepted the seller&apos;s quote of ₹{request.quotedPrice}
                    </p>
                    <p className="text-p4 font-body text-pneutral-700 mb-3">
                      {expired
                        ? `This quote expired on ${new Date(request.quoteValidUntil!).toLocaleDateString()}. Ask the seller for a new quote to place this order.`
                        : "Place this order to have it shipped at the agreed price."}
                    </p>
                    <button
                      type="button"
                      disabled={expired}
                      onClick={() => handlePlaceOrder(request.quoteRequestId)}
                      className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Place Order
                    </button>
                  </div>
                );
              })()}

              {request.status === "ORDER_PLACED" && (
                <div className="bg-success-50 rounded-xl p-4 mt-3">
                  <p className="text-p3 font-heading font-semibold text-pneutral-900">
                    Order placed{request.orderId ? ` — ${request.orderId}` : ""}
                  </p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
