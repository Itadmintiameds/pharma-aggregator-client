"use client";

import { useState } from "react";
import { requestReturn } from "@/src/services/buyer/returnService";
import { RETURN_REASONS } from "@/src/types/buyer/returns";

// Reason and details for the items the buyer ticked.
export default function ReturnRequestForm({
  items,
  buyerId,
  onDone,
  onCancel,
}: {
  items: { orderItemId: number; quantity: number }[];
  buyerId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [reasonCode, setReasonCode] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = !reasonCode
    ? "Choose a reason."
    : reasonCode === "OTHER" && !details.trim()
      ? "Describe the problem."
      : null;

  const submit = async () => {
    if (missing) return;
    setBusy(true);
    setError(null);
    try {
      await requestReturn({ items, buyerId, reasonCode, reason: details.trim() || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request a return.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
      <p className="text-p3 font-heading font-semibold text-pneutral-900">
        Return {items.length} item{items.length === 1 ? "" : "s"}
      </p>

      <label className="text-p4 font-body text-pneutral-700">
        Reason
        <select
          value={reasonCode}
          disabled={busy}
          onChange={(e) => setReasonCode(e.target.value)}
          className="block w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
        >
          <option value="">Select a reason</option>
          {RETURN_REASONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-p4 font-body text-pneutral-700">
        Details{reasonCode === "OTHER" ? "" : " (optional)"}
        <textarea
          value={details}
          disabled={busy}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          placeholder="What's wrong with the item? Batch number, expiry date, etc."
          className="block w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white resize-none"
        />
      </label>

      {error && <p className="text-p4 font-body text-red-600">{error}</p>}
      {!error && missing && reasonCode && <p className="text-p4 font-body text-pneutral-500">{missing}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || missing !== null}
          onClick={submit}
          className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {busy ? "Submitting..." : "Submit return"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="border border-neutral-300 text-neutral-700 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
