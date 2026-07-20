"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import {
  addStock,
  type BatchAvailability,
  type StockLedgerResponse,
} from "@/src/services/product/StockService";

interface BatchStockUpdateModalProps {
  onClose: () => void;
  productName?: string | null;
  productId?: string | null;
  batch: BatchAvailability;
  onSuccess?: (result: StockLedgerResponse) => void;
}

interface SuccessResult {
  batchNumber: string;
  previousStock: number;
  addedStock: number;
  updatedStock: number;
}

const PURPLE = "var(--Colors-Brand-Primary-800, #6C12A9)";
const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    "Something went wrong. Please try again."
  );
}

// This modal is deliberately self-contained (not built on StockUpdateModal):
// it's mounted only when a specific batch's "Update Stock" row action is
// clicked, so it opens straight into the quantity form with no wizard steps
// and no loading flash — the batch data is already known by the time it mounts.
export default function BatchStockUpdateModal({
  onClose,
  productName,
  productId,
  batch,
  onSuccess,
}: BatchStockUpdateModalProps) {
  const [addQuantity, setAddQuantity] = useState("");
  const [dateOfStockEntry, setDateOfStockEntry] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  const isValid =
    addQuantity.trim() !== "" &&
    !isNaN(Number(addQuantity)) &&
    Number(addQuantity) !== 0 &&
    (batch.stockQuantity ?? 0) + Number(addQuantity) >= 0;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!productId) {
      setSubmitError("Missing product ID — cannot update stock.");
      return;
    }
    if (!isValid) return;

    setSubmitError(null);
    try {
      setSubmitting(true);
      const response = await addStock({
        productId,
        packagingId: batch.packagingId ?? undefined,
        batchLotNumber: batch.batchLotNumber,
        manufacturingDate: batch.manufacturingDate,
        expiryDate: batch.expiryDate,
        quantity: Number(addQuantity),
        referenceType: "MANUAL_STOCK_UPDATE",
      });
      setResult({
        batchNumber: response.batchLotNumber,
        previousStock: response.balanceAfter - response.quantity,
        addedStock: response.quantity,
        updatedStock: response.balanceAfter,
      });
      onSuccess?.(response);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const previewCurrent = batch.stockQuantity ?? 0;
  const previewAdded = Number(addQuantity) || 0;
  const previewUpdated = previewCurrent + previewAdded;
  const previewIsDecrease = previewAdded < 0;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(28, 25, 23, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: result ? 460 : 640,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 16,
          boxShadow:
            "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          fontFamily: "'Noto Sans', sans-serif",
        }}
      >
        {result ? (
          <SuccessView productId={productId} result={result} onClose={onClose} />
        ) : (
          <>
            {/* ── HEADER ── */}
            <div
              style={{
                padding: "24px 24px 16px",
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 600,
                    color: TEXT_DARK,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  Stock Update
                </h2>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_GRAY }}>
                  Product: {productName || "—"}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: TEXT_GRAY }}>
                  Product ID: {productId || "—"}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: TEXT_GRAY,
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ padding: "24px", minHeight: 200 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    background: "#FAFAF9",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    alignSelf: "start",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Batch Information
                  </p>
                  <InfoPair label="Batch Number" value={batch.batchLotNumber || "—"} />
                  <InfoPair
                    label="Manufacturing Date"
                    value={formatDate(batch.manufacturingDate)}
                  />
                  <InfoPair label="Expiry Date" value={formatDate(batch.expiryDate)} />
                  <InfoPair
                    label="Current Stock Quantity"
                    value={`${(batch.stockQuantity ?? 0).toLocaleString()} Packs`}
                  />
                  <InfoPair
                    label="Discount %"
                    value={
                      batch.discountPercentage != null
                        ? `${batch.discountPercentage}%`
                        : "—"
                    }
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_DARK,
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    Add Stock Details
                  </p>
                  <Field label="Stock Adjustment Quantity *">
                    <div style={{ display: "flex" }}>
                      <input
                        type="number"
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(e.target.value)}
                        placeholder="e.g. 50 to add, -20 to remove"
                        style={{
                          ...inputStyle,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          borderRight: "none",
                        }}
                      />
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0 14px",
                          border: `1px solid ${BORDER}`,
                          borderTopRightRadius: 8,
                          borderBottomRightRadius: 8,
                          background: "#F5F5F5",
                          fontSize: 13,
                          color: TEXT_GRAY,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Pack(s)
                      </span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: TEXT_GRAY }}>
                      Enter a positive number to add stock, or a negative number to
                      deduct stock from this batch.
                    </p>
                  </Field>
                  <Field label="Date of Stock Entry">
                    <input
                      type="date"
                      value={dateOfStockEntry}
                      onChange={(e) => setDateOfStockEntry(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Remarks (Optional)">
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks (optional)"
                      rows={2}
                      style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical" }}
                    />
                  </Field>

                  <div
                    style={{
                      background: previewIsDecrease ? "#FEF2F2" : "#F0FDF4",
                      border: `1px solid ${previewIsDecrease ? "#FCA5A5" : "#86EFAC"}`,
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: previewIsDecrease ? "#B91C1C" : "#15803D",
                      }}
                    >
                      Updated Stock Quantity
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <SumBlock value={previewCurrent} label="Current Stock" />
                      <span style={{ fontSize: 18, color: previewIsDecrease ? "#B91C1C" : "#15803D" }}>
                        {previewIsDecrease ? "−" : "+"}
                      </span>
                      <SumBlock value={Math.abs(previewAdded)} label={previewIsDecrease ? "Removed Stock" : "Added Stock"} />
                      <span style={{ fontSize: 18, color: previewIsDecrease ? "#B91C1C" : "#15803D" }}>=</span>
                      <SumBlock
                        value={previewUpdated}
                        label="Updated Stock"
                        bold
                        suffix="Packs"
                      />
                    </div>
                    {previewUpdated < 0 && (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B91C1C" }}>
                        Updated stock cannot go below 0.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#B91C1C",
                    fontSize: 13,
                  }}
                >
                  {submitError}
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div
              style={{
                borderTop: `1px solid ${BORDER}`,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                onClick={handleClose}
                disabled={submitting}
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  background: "white",
                  color: TEXT_DARK,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "'Work Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid || submitting}
                style={{
                  height: 44,
                  padding: "0 20px",
                  borderRadius: 8,
                  border: "none",
                  background: PURPLE,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !isValid || submitting ? "not-allowed" : "pointer",
                  opacity: !isValid || submitting ? 0.55 : 1,
                  fontFamily: "'Work Sans', sans-serif",
                }}
              >
                {submitting ? "Updating…" : "Update Stock"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  padding: "0 12px",
  fontSize: 14,
  color: TEXT_DARK,
  boxSizing: "border-box",
  fontFamily: "'Noto Sans', sans-serif",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: TEXT_DARK,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: TEXT_GRAY }}>{label}</div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: TEXT_DARK,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SumBlock({
  value,
  label,
  bold,
  suffix,
}: {
  value: number;
  label: string;
  bold?: boolean;
  suffix?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: bold ? 20 : 18,
          fontWeight: bold ? 700 : 600,
          color: bold ? "#15803D" : TEXT_DARK,
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {value.toLocaleString()}
        {suffix ? (
          <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4 }}>
            {suffix}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: 11, color: TEXT_GRAY }}>{label}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, color: TEXT_GRAY }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: TEXT_DARK,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const CONFETTI = [
  { top: "6%", left: "12%", color: "#A855F7", rotate: "18deg" },
  { top: "10%", left: "82%", color: "#22C55E", rotate: "-15deg" },
  { top: "70%", left: "8%", color: "#3B82F6", rotate: "30deg" },
  { top: "76%", left: "88%", color: "#FBBF24", rotate: "-25deg" },
  { top: "40%", left: "4%", color: "#FBBF24", rotate: "10deg" },
  { top: "36%", left: "94%", color: "#A855F7", rotate: "-10deg" },
];

function SuccessView({
  productId,
  result,
  onClose,
}: {
  productId?: string | null;
  result: SuccessResult;
  onClose: () => void;
}) {
  return (
    <div style={{ padding: "40px 32px 32px", position: "relative" }}>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: 8,
            height: 8,
            borderRadius: 2,
            background: c.color,
            transform: `rotate(${c.rotate})`,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={28} color="white" strokeWidth={3} />
          </div>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 700,
            color: "#15803D",
            fontFamily: "'Work Sans', sans-serif",
          }}
        >
          Stock Updated Successfully!
        </h2>

        <div
          style={{
            width: "100%",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <ReviewRow label="Product ID" value={productId || "—"} />
            <ReviewRow label="Batch Number" value={result.batchNumber || "—"} />
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}` }} />
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <ReviewRow
              label="Previous Stock"
              value={`${result.previousStock.toLocaleString()} Packs`}
            />
            <ReviewRow
              label={result.addedStock < 0 ? "Removed Stock" : "Added Stock"}
              value={`${Math.abs(result.addedStock).toLocaleString()} Packs`}
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, color: TEXT_GRAY }}>Updated Stock</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>
                {result.updatedStock.toLocaleString()} Packs
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 8,
            border: "none",
            background: PURPLE,
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Work Sans', sans-serif",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
