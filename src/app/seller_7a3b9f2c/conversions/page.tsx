"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSellerQuoteRequests, respondToQuoteRequest } from "@/src/services/seller/quoteRequestService";
import { QuoteRequest } from "@/src/types/quote/quoteRequest";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-info-50 text-info-600",
  QUOTED: "bg-warning-50 text-warning-600",
  ACCEPTED: "bg-success-50 text-success-600",
  REJECTED: "bg-red-50 text-red-500",
  EXPIRED: "bg-neutral-100 text-neutral-600",
};

const TYPE_LABELS: Record<string, string> = {
  PRICE_REQUEST: "Price Request",
  RFQ: "RFQ",
};

function RespondForm({
  onSubmit,
  busy,
}: {
  onSubmit: (quotedPrice: number, quoteValidUntil: string, sellerNotes: string) => void;
  busy: boolean;
}) {
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");

  return (
    <div className="flex flex-col gap-2 mt-3 p-3 bg-neutral-50 rounded-lg">
      <input
        type="number"
        min={0}
        placeholder="Your quoted price (per unit)"
        value={quotedPrice}
        onChange={(e) => setQuotedPrice(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <input
        type="date"
        placeholder="Quote valid until"
        value={quoteValidUntil}
        onChange={(e) => setQuoteValidUntil(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <textarea
        rows={2}
        placeholder="Notes for the buyer (optional)"
        value={sellerNotes}
        onChange={(e) => setSellerNotes(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-none"
      />
      <button
        disabled={busy || !quotedPrice || Number(quotedPrice) <= 0}
        onClick={() => onSubmit(Number(quotedPrice), quoteValidUntil, sellerNotes)}
        className="bg-primary-900 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40"
      >
        {busy ? "Sending..." : "Send Quote"}
      </button>
    </div>
  );
}

function QuoteRequestCard({
  request,
  onChanged,
}: {
  request: QuoteRequest;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  const handleRespond = async (quotedPrice: number, quoteValidUntil: string, sellerNotes: string) => {
    setBusy(true);
    setError(null);
    try {
      await respondToQuoteRequest(request.quoteRequestId, {
        quotedPrice,
        quoteValidUntil: quoteValidUntil || undefined,
        sellerNotes: sellerNotes || undefined,
      });
      toast.success("Quote sent to buyer");
      setResponding(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your response");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-p2 font-heading font-semibold text-pneutral-900">{request.productName}</p>
          <p className="text-p4 font-body text-pneutral-600">
            {TYPE_LABELS[request.requestType] ?? request.requestType}
            {request.companyName && ` • ${request.companyName}`}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-p4 font-body text-pneutral-600 mb-3">
        <div>
          <p className="text-pneutral-400">Quantity</p>
          <p className="text-pneutral-900">{request.quantity} {request.unit}</p>
        </div>
        {request.targetPrice != null && (
          <div>
            <p className="text-pneutral-400">Buyer's target price</p>
            <p className="text-pneutral-900">₹{request.targetPrice}</p>
          </div>
        )}
        {request.deliveryLocation && (
          <div>
            <p className="text-pneutral-400">Delivery location</p>
            <p className="text-pneutral-900">{request.deliveryLocation}</p>
          </div>
        )}
        <div>
          <p className="text-pneutral-400">Contact</p>
          <p className="text-pneutral-900">{request.contactPerson ?? "—"} • {request.phone}</p>
        </div>
      </div>

      {request.message && (
        <p className="text-p4 font-body text-pneutral-600 mb-3 italic">&quot;{request.message}&quot;</p>
      )}

      {error && <p className="text-p4 text-red-600 mb-2">{error}</p>}

      {request.status === "PENDING" && !responding && (
        <button
          onClick={() => setResponding(true)}
          className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Respond with a Quote
        </button>
      )}

      {request.status === "PENDING" && responding && (
        <RespondForm busy={busy} onSubmit={handleRespond} />
      )}

      {request.status !== "PENDING" && request.quotedPrice != null && (
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-p3 font-heading font-semibold text-pneutral-900">
            You quoted ₹{request.quotedPrice}
            {request.quoteValidUntil && ` (valid until ${new Date(request.quoteValidUntil).toLocaleDateString()})`}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ConversionsPage() {
  const [requests, setRequests] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    try {
      const data = await getSellerQuoteRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote requests.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = requests?.filter((r) => statusFilter === "ALL" || r.status === statusFilter) ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h4 font-heading font-medium text-pneutral-900">Quote Requests</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["ALL", "PENDING", "QUOTED", "ACCEPTED", "REJECTED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {requests === null && !error && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {requests !== null && filtered.length === 0 && (
        <p className="text-p3 font-body text-neutral-500">No quote requests found.</p>
      )}

      {requests !== null && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((request) => (
            <QuoteRequestCard key={request.quoteRequestId} request={request} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
