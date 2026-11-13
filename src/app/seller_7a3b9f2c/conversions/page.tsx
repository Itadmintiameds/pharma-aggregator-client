"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSellerQuoteRequests, respondToQuoteRequest } from "@/src/services/seller/quoteRequestService";
import { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { ProductSummary, ProductThumb, StatusBadge, prettyStatus, useProductSummaries } from "../components/sellerCardUi";

const STATUS_FILTERS = ["ALL", "PENDING", "QUOTED", "ACCEPTED", "ORDER_PLACED", "REJECTED", "EXPIRED"];

const TYPE_LABELS: Record<string, string> = {
  PRICE_REQUEST: "Price request",
  RFQ: "RFQ",
};

const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 break-words text-p4 font-body font-medium text-neutral-900">{children}</p>
    </div>
  );
}

function RespondForm({
  quantity,
  unit,
  targetPrice,
  onSubmit,
  onCancel,
  busy,
}: {
  quantity: number;
  unit?: string;
  targetPrice?: number;
  onSubmit: (quotedPrice: number, quoteValidUntil: string, sellerNotes: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");

  const price = Number(quotedPrice);
  const validPrice = quotedPrice !== "" && Number.isFinite(price) && price > 0;
  const fieldClass = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary-600";

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="mb-3 text-p3 font-heading font-semibold text-neutral-900">Your quote</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
          Price per unit (₹)
          <input
            type="number"
            min={0}
            placeholder={targetPrice != null ? `Buyer's target: ${targetPrice}` : "e.g. 120"}
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-600">
          Valid until
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={quoteValidUntil}
            onChange={(e) => setQuoteValidUntil(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-neutral-600">
        Notes for the buyer (optional)
        <textarea
          rows={2}
          value={sellerNotes}
          onChange={(e) => setSellerNotes(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </label>
      {validPrice && (
        <p className="mt-3 text-p4 font-body text-neutral-600">
          Order value: <span className="font-semibold text-neutral-900">{money(price * quantity)}</span> for {quantity}{" "}
          {unit ?? "units"}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy || !validPrice}
          onClick={() => onSubmit(price, quoteValidUntil, sellerNotes)}
          className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Sending..." : "Send quote"}
        </button>
        <button
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function QuoteRequestCard({
  request,
  product,
  onChanged,
}: {
  request: QuoteRequest;
  product?: ProductSummary;
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

  const requestedOn = formatDate(request.createdAt);
  const quoted = request.quotedPrice;
  // How the quote compares with what the buyer asked for (only meaningful when they gave a target).
  const vsTarget =
    quoted != null && request.targetPrice
      ? Math.round(((quoted - request.targetPrice) / request.targetPrice) * 100)
      : null;
  const unitLabel = request.unit ?? "units";
  const listedPrice = product?.listedPrice;
  // Quote vs the product's current listed price (a negative gap means the quote is a discount).
  const vsListed =
    quoted != null && listedPrice ? Math.round(((quoted - listedPrice) / listedPrice) * 100) : null;

  return (
    <div
      id={`quote-${request.quoteRequestId}`}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-4 border-b border-neutral-100 px-6 py-4">
        <ProductThumb src={product?.image} alt={request.productName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-p2 font-heading font-semibold text-pneutral-900">{request.productName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-p4 font-body text-neutral-500">
            <span className="font-semibold text-neutral-700">Quote #{request.quoteRequestId}</span>
            <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
              {TYPE_LABELS[request.requestType] ?? request.requestType}
            </span>
            {request.companyName && <span>{request.companyName}</span>}
            {requestedOn && <span>· Requested {requestedOn}</span>}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-4 sm:grid-cols-3 lg:grid-cols-4">
        <Detail label="Quantity">
          {request.quantity} {unitLabel}
        </Detail>
        {listedPrice != null && <Detail label="Original listed price">{money(listedPrice)} / unit</Detail>}
        {request.targetPrice != null && <Detail label="Buyer's target price">{money(request.targetPrice)} / unit</Detail>}
        {request.deliveryLocation && <Detail label="Delivery location">{request.deliveryLocation}</Detail>}
        {request.pincode && <Detail label="Pincode">{request.pincode}</Detail>}
        {request.expectedDeliveryDate && (
          <Detail label="Needed by">{formatDate(request.expectedDeliveryDate)}</Detail>
        )}
        {request.paymentTerms && <Detail label="Payment terms">{request.paymentTerms}</Detail>}
        {request.gstNumber && <Detail label="GST number">{request.gstNumber}</Detail>}
      </div>

      {request.message && (
        <div className="mx-6 mb-4 rounded-lg border-l-4 border-neutral-200 bg-neutral-50 px-4 py-2">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Buyer&apos;s message</p>
          <p className="text-p4 font-body italic text-neutral-700">&quot;{request.message}&quot;</p>
        </div>
      )}

      {request.status !== "PENDING" && quoted != null && (
        <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">Your quote</p>
              <p className="text-h6 font-heading font-semibold text-neutral-900">
                {money(quoted)} <span className="text-p4 font-normal text-neutral-500">/ unit</span>
              </p>
              {listedPrice != null && (
                <p className="text-xs text-neutral-500">
                  Listed price <span className="line-through">{money(listedPrice)}</span>
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
                    ? "Matches the buyer's target"
                    : `${Math.abs(vsTarget)}% ${vsTarget > 0 ? "above" : "below"} the buyer's target`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-6">
              <Detail label="Order value">{money(quoted * request.quantity)}</Detail>
              {request.quoteValidUntil && <Detail label="Valid until">{formatDate(request.quoteValidUntil)}</Detail>}
              {request.orderId && <Detail label="Order">{request.orderId}</Detail>}
            </div>
          </div>
          {request.sellerNotes && (
            <p className="mt-3 text-p4 font-body text-neutral-600">
              <span className="text-neutral-500">Your note:</span> {request.sellerNotes}
            </p>
          )}
        </div>
      )}

      {(error || request.status === "PENDING") && (
        <div className="border-t border-neutral-100 px-6 py-4">
          {error && <p className="mb-2 text-p4 text-red-600">{error}</p>}

          {request.status === "PENDING" && !responding && (
            <button
              onClick={() => setResponding(true)}
              className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Respond with a quote
            </button>
          )}

          {request.status === "PENDING" && responding && (
            <RespondForm
              busy={busy}
              quantity={request.quantity}
              unit={request.unit}
              targetPrice={request.targetPrice}
              onSubmit={handleRespond}
              onCancel={() => setResponding(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ConversionsPage() {
  const [requests, setRequests] = useState<QuoteRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const products = useProductSummaries((requests ?? []).map((r) => r.productId));

  const load = useCallback(async () => {
    try {
      const data = await getSellerQuoteRequests();
      setRequests([...data].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote requests.");
    }
  }, []);

  useEffect(() => {
    // Deep link from the dashboard tiles, e.g. ?status=PLACED opens that tab.
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && STATUS_FILTERS.includes(wanted)) queueMicrotask(() => setStatusFilter(wanted));
  }, []);

  useEffect(() => {
    // Deferred to a microtask: the set-state-in-effect lint rule flags load() when called directly.
    queueMicrotask(load);
  }, [load]);

  const countFor = (status: string) =>
    status === "ALL" ? requests?.length ?? 0 : requests?.filter((r) => r.status === status).length ?? 0;
  const filtered = requests?.filter((r) => statusFilter === "ALL" || r.status === statusFilter) ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-h4 font-heading font-medium text-pneutral-900">Quote Requests</h1>
        <p className="mt-1 text-p4 font-body text-neutral-500">
          Buyers asking for a price or a bulk quote on your products.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {prettyStatus(status)}
            {requests !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
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
        <div className="space-y-5">
          {filtered.map((request) => (
            <QuoteRequestCard
              key={request.quoteRequestId}
              request={request}
              product={products[request.productId]}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
