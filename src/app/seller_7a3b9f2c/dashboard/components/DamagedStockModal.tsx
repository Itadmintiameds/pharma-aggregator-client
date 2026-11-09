"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { X } from "lucide-react";
import { adjustDamagedStock, type DamagedStockAction } from "@/src/services/product/StockService";

const PURPLE = "var(--Colors-Brand-Primary-800, #6C12A9)";
const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.response?.data?.error || err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

const ACTIONS: { value: DamagedStockAction; label: string; help: string }[] = [
  {
    value: "DISPOSE",
    label: "Dispose / write off",
    help: "The units are discarded and removed from inventory. Available stock does not change.",
  },
  {
    value: "RESTOCK",
    label: "Move back to available stock",
    help: "The units were re-checked and are fine to sell. They are added to available stock.",
  },
];

interface DamagedStockModalProps {
  productId: string;
  pricingId: string;
  batchLotNumber?: string | null;
  stockQuantity: number;
  damagedQuantity: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Lets the seller reduce a batch's damaged (returned) stock — either writing units off or moving
// them back to sellable stock. Damaged stock only ever goes up through return receipts.
export default function DamagedStockModal({
  productId,
  pricingId,
  batchLotNumber,
  stockQuantity,
  damagedQuantity,
  onClose,
  onSuccess,
}: DamagedStockModalProps) {
  const [action, setAction] = useState<DamagedStockAction>("DISPOSE");
  const [quantity, setQuantity] = useState(String(damagedQuantity));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(quantity);
  const valid = quantity !== "" && Number.isInteger(qty) && qty > 0 && qty <= damagedQuantity;
  const damagedAfter = valid ? damagedQuantity - qty : damagedQuantity;
  const stockAfter = valid && action === "RESTOCK" ? stockQuantity + qty : stockQuantity;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await adjustDamagedStock(productId, pricingId, action, qty);
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6"
        style={{ width: "min(30rem, 100%)", fontFamily: "'Work Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 style={{ color: TEXT_DARK, fontSize: 18, fontWeight: 600 }}>Manage Damaged Stock</h3>
            <p style={{ color: TEXT_GRAY, fontSize: 13 }}>
              Batch {batchLotNumber || "—"} · {damagedQuantity} damaged · {stockQuantity} available
            </p>
          </div>
          <button onClick={onClose} disabled={submitting} aria-label="Close" style={{ color: TEXT_GRAY }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {ACTIONS.map((a) => (
            <label
              key={a.value}
              className="flex gap-3 p-3 rounded-lg cursor-pointer"
              style={{ border: `1px solid ${action === a.value ? PURPLE : BORDER}` }}
            >
              <input
                type="radio"
                name="damaged-action"
                checked={action === a.value}
                onChange={() => setAction(a.value)}
                style={{ accentColor: "#6C12A9", marginTop: 3 }}
              />
              <span>
                <span style={{ color: TEXT_DARK, fontSize: 14, fontWeight: 600, display: "block" }}>{a.label}</span>
                <span style={{ color: TEXT_GRAY, fontSize: 12.5 }}>{a.help}</span>
              </span>
            </label>
          ))}
        </div>

        <label style={{ color: TEXT_DARK, fontSize: 13, fontWeight: 600 }}>
          Quantity (max {damagedQuantity})
          <input
            type="number"
            min={1}
            max={damagedQuantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="block w-full mt-1 px-3 py-2 rounded-lg text-sm"
            style={{ border: `1px solid ${BORDER}`, fontWeight: 400 }}
          />
        </label>

        {valid ? (
          <p style={{ color: TEXT_GRAY, fontSize: 12.5, marginTop: 8 }}>
            After this: {damagedAfter} damaged · {stockAfter} available
          </p>
        ) : (
          <p style={{ color: "#B42318", fontSize: 12.5, marginTop: 8 }}>
            Enter a whole number between 1 and {damagedQuantity}.
          </p>
        )}

        {error && <p style={{ color: "#B42318", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !valid}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: PURPLE }}
          >
            {submitting ? "Saving..." : action === "DISPOSE" ? "Dispose" : "Move to Stock"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
