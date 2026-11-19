"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import {
  replaceBatchOffers,
  type SpecialDiscountPayload,
} from "@/src/services/product/StockService";
import OfferWindowFields from "./OfferWindowFields";
import {
  type OfferWindowInput,
  emptyOfferWindow,
  offerWindowError,
  offerWindowPayload,
  toTimeInput,
  getOfferStatus,
} from "@/src/utils/offerWindow";

const PURPLE = "var(--Colors-Brand-Primary-800, #6C12A9)";
const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

interface Row extends OfferWindowInput {
  minimumPurchaseQuantity: string;
  percentage: string;
  displayOffer: boolean;
  // The offer's window has already ended: shown read-only, never validated, kept as it is.
  expired?: boolean;
}

const emptyRow = (): Row => ({
  minimumPurchaseQuantity: "",
  percentage: "",
  displayOffer: true,
  ...emptyOfferWindow(),
});

// Existing offers arrive under either naming (response uses minimumPurchaseQuantity / effective*,
// older paths minQty / startDate), so read both.
const toRow = (d: any): Row => ({
  minimumPurchaseQuantity: String(d?.minimumPurchaseQuantity ?? d?.minQty ?? ""),
  percentage: String(d?.additionalDiscountPercentage ?? d?.discountPercentage ?? ""),
  displayOffer: d?.displayOffer !== false,
  startDate: d?.effectiveStartDate ?? d?.startDate ?? "",
  startTime: toTimeInput(d?.effectiveStartTime ?? d?.startTime),
  endDate: d?.effectiveEndDate ?? d?.endDate ?? "",
  endTime: toTimeInput(d?.effectiveEndTime ?? d?.endTime),
  expired: getOfferStatus(d ?? {}) === "Expired",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  padding: "0 10px",
  fontSize: 13.5,
  color: TEXT_DARK,
  boxSizing: "border-box",
  fontFamily: "'Noto Sans', sans-serif",
};

function extractErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    "Something went wrong. Please try again."
  );
}

/**
 * Edit the quantity offers (and their start/end date-time) of an EXISTING batch.
 * Saving replaces the batch's whole offer list, so removing a row here deletes that offer.
 */
export default function BatchOffersModal({
  productId,
  pricingId,
  batchLotNumber,
  existingOffers,
  baseDiscount,
  minOrderQty,
  maxOrderQty,
  stockQuantity,
  onClose,
  onSaved,
}: {
  productId: string;
  pricingId: string;
  batchLotNumber?: string | null;
  existingOffers?: any[];
  baseDiscount?: number | null;
  minOrderQty?: number | null;
  maxOrderQty?: number | null;
  stockQuantity?: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (existingOffers ?? []).map(toRow)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const rowError = (row: Row): string | null => {
    if (row.expired) return null; // already over - it can never apply, so no reachability rules
    const qty = Number(row.minimumPurchaseQuantity);
    const pct = Number(row.percentage);
    if (!(qty > 0)) return "Enter a minimum purchase quantity";
    if (row.percentage.trim() === "" || !(pct > 0) || pct > 100)
      return "Discount must be above 0 and at most 100%";
    if (baseDiscount != null && pct <= baseDiscount)
      return `Discount must be higher than the batch's regular discount (${baseDiscount}%)`;
    if (minOrderQty != null && qty <= minOrderQty)
      return `Minimum quantity must be above the minimum order quantity (${minOrderQty})`;
    // A buyer can order at most min(max order quantity, stock): a slab above that is never reachable.
    if (maxOrderQty != null && qty > maxOrderQty)
      return `Minimum quantity is above this batch's maximum order quantity (${maxOrderQty}) - buyers could never reach it`;
    if (stockQuantity != null && qty > stockQuantity)
      return `Minimum quantity is above this batch's available stock (${stockQuantity}) - add stock or lower the quantity`;
    return offerWindowError(row);
  };

  // One bad offer must not block the good ones: only the valid rows are saved, and the invalid ones are
  // listed (and dropped) so the seller knows exactly what Save will do.
  const validRows = rows.filter((row) => rowError(row) == null);
  const invalidNumbers = rows.flatMap((row, i) => (rowError(row) != null ? [i + 1] : []));
  const nothingToSave = rows.length > 0 && validRows.length === 0;

  const save = async () => {
    if (nothingToSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: SpecialDiscountPayload[] = validRows.map((row) => ({
        minimumPurchaseQuantity: Number(row.minimumPurchaseQuantity),
        additionalDiscountPercentage: Number(row.percentage),
        displayOffer: row.displayOffer,
        ...offerWindowPayload(row),
      }));
      // Backend reads minQty / discountPercentage as well as the UI names - send both like addStock does.
      const wire = payload.map((d) => ({
        ...d,
        minQty: d.minimumPurchaseQuantity,
        discountPercentage: d.additionalDiscountPercentage,
      }));
      await replaceBatchOffers(productId, pricingId, wire);
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(28, 25, 23, 0.45)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          height: "100%",
          background: "white",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Noto Sans', sans-serif",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: TEXT_DARK,
                fontFamily: "'Work Sans', sans-serif",
              }}
            >
              Special Offers
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: TEXT_GRAY }}>
              Batch {batchLotNumber || "—"}. Each offer applies once its minimum
              quantity is purchased, only between its start and end.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_GRAY, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {rows.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: TEXT_GRAY }}>
              No special offers on this batch. Add one below, or save to keep it empty.
            </p>
          )}
          {rows.map((row, i) => {
            const err = rowError(row);
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${err ? "#FCA5A5" : BORDER}`,
                  background: row.expired ? "#F3F4F6" : "#FAFAF9",
                  borderRadius: 10,
                  padding: 14,
                  opacity: row.expired ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_GRAY }}>
                    Offer {i + 1}
                    {row.expired && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#FEE2E2",
                          color: "#B91C1C",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Expired
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                    aria-label={`Remove offer ${i + 1}`}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: TEXT_GRAY, padding: 4 }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <fieldset
                  disabled={row.expired}
                  style={{ border: 0, padding: 0, margin: 0, minWidth: 0, cursor: row.expired ? "not-allowed" : undefined }}
                >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>
                      Min purchase quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={row.minimumPurchaseQuantity}
                      onChange={(e) => update(i, { minimumPurchaseQuantity: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>
                      Discount %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={row.percentage}
                      onChange={(e) => update(i, { percentage: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <OfferWindowFields value={row} onChange={(patch) => update(i, patch)} />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                    fontSize: 13,
                    color: TEXT_DARK,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={row.displayOffer}
                    onChange={(e) => update(i, { displayOffer: e.target.checked })}
                  />
                  Display this offer to buyers
                </label>
                </fieldset>
                {row.expired && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: TEXT_GRAY }}>
                    This offer has ended, so it can no longer be edited. Remove it, or add a new offer.
                  </p>
                )}
                {err && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B91C1C" }}>{err}</p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setRows((r) => [...r, emptyRow()])}
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: PURPLE,
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            + Add an offer
          </button>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {invalidNumbers.length > 0 && (
          <div
            style={{
              margin: "0 20px 12px",
              padding: "8px 12px",
              borderRadius: 8,
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              color: "#92400E",
              fontSize: 12.5,
            }}
          >
            {nothingToSave
              ? `Fix the error in ${invalidNumbers.length === 1 ? "the offer" : "the offers"} above to save.`
              : `Offer ${invalidNumbers.join(", ")} ${invalidNumbers.length === 1 ? "has" : "have"} an error and will NOT be saved (any existing ${invalidNumbers.length === 1 ? "offer" : "offers"} in ${invalidNumbers.length === 1 ? "it" : "them"} will be removed). Fix ${invalidNumbers.length === 1 ? "it" : "them"} first if you want to keep ${invalidNumbers.length === 1 ? "it" : "them"}.`}
          </div>
        )}

        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              background: "white",
              color: TEXT_DARK,
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || nothingToSave}
            style={{
              height: 40,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: PURPLE,
              color: "white",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: saving || nothingToSave ? "not-allowed" : "pointer",
              opacity: saving || nothingToSave ? 0.55 : 1,
            }}
          >
            {saving
              ? "Saving…"
              : invalidNumbers.length > 0
                ? `Save ${validRows.length} valid offer${validRows.length === 1 ? "" : "s"}`
                : "Save offers"}
          </button>
        </div>
      </div>
    </div>
  );
}
