"use client";

import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import {
  addStock,
  type StockLedgerResponse,
} from "@/src/services/product/StockService";
import { validateBatchNumber } from "@/src/services/product/PricingService";
import {
  getPackTypesByCategory,
  getPackTypeUnits,
} from "@/src/services/product/PackTypeService";

interface SelectOption {
  value: string;
  label: string;
}

interface AddBatchModalProps {
  onClose: () => void;
  productName?: string | null;
  productId?: string | null;
  categoryId?: number | null;
  onSuccess?: (result: StockLedgerResponse) => void;
}

interface SuccessResult {
  batchNumber: string;
  updatedStock: number;
}

const PURPLE = "var(--Colors-Brand-Primary-800, #6C12A9)";
const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

function extractErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    "Something went wrong. Please try again."
  );
}

// Self-contained, like BatchStockUpdateModal: mounted only when the "Add New
// Batch" button is clicked, so it opens straight into the form — no
// "select update type" step, no stepper.
export default function AddBatchModal({
  onClose,
  productName,
  productId,
  categoryId,
  onSuccess,
}: AddBatchModalProps) {
  const [newBatch, setNewBatch] = useState({
    batchLotNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: "",
    mrp: "",
    sellingPrice: "",
    packId: "",
    packTypeUnitId: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
  });
  const [batchNumberError, setBatchNumberError] = useState<string | null>(null);
  const [checkingBatchNumber, setCheckingBatchNumber] = useState(false);

  const [packTypeOptions, setPackTypeOptions] = useState<SelectOption[]>([]);
  const [packTypeUnitOptions, setPackTypeUnitOptions] = useState<SelectOption[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  useEffect(() => {
    if (categoryId == null) return;
    getPackTypesByCategory(categoryId)
      .then((list: any[]) =>
        setPackTypeOptions(
          (list ?? []).map((p) => ({
            value: String(p.packId ?? p.id),
            label: p.packType ?? p.packTypeName ?? p.name ?? `Pack ${p.packId}`,
          }))
        )
      )
      .catch((err) => console.error("Error fetching pack types:", err));
    getPackTypeUnits()
      .then((list: any[]) =>
        setPackTypeUnitOptions(
          (list ?? []).map((u) => ({
            value: String(u.packTypeUnitId),
            label: u.packTypeUnitName,
          }))
        )
      )
      .catch((err) => console.error("Error fetching pack type units:", err));
  }, [categoryId]);

  const checkBatchNumber = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || categoryId == null) {
      setBatchNumberError(null);
      return;
    }
    try {
      setCheckingBatchNumber(true);
      const response = await validateBatchNumber(trimmed, categoryId);
      setBatchNumberError(response?.exists ? "This batch ID already exists" : null);
    } catch (err) {
      console.error("Batch validation failed:", err);
    } finally {
      setCheckingBatchNumber(false);
    }
  };

  const handleBatchLotNumberChange = (value: string) => {
    setNewBatch((v) => ({ ...v, batchLotNumber: value }));
    if (!value.trim()) {
      setBatchNumberError(null);
      return;
    }
    checkBatchNumber(value);
  };

  // packSize is derived (unitPerPack × numberOfPacks), same as the product forms.
  const handleUnitPerPackOrCountChange = (
    field: "unitPerPack" | "numberOfPacks",
    value: string
  ) => {
    setNewBatch((v) => {
      const next = { ...v, [field]: value };
      const unitPerPack = Number(next.unitPerPack) || 0;
      const numberOfPacks = Number(next.numberOfPacks) || 0;
      next.packSize =
        unitPerPack && numberOfPacks ? String(unitPerPack * numberOfPacks) : "";
      return next;
    });
  };

  const isValid =
    newBatch.batchLotNumber.trim() !== "" &&
    !batchNumberError &&
    !checkingBatchNumber &&
    newBatch.manufacturingDate !== "" &&
    newBatch.expiryDate !== "" &&
    Number(newBatch.quantity) > 0 &&
    !isNaN(Number(newBatch.quantity)) &&
    Number(newBatch.mrp) > 0 &&
    !isNaN(Number(newBatch.mrp)) &&
    Number(newBatch.sellingPrice) > 0 &&
    !isNaN(Number(newBatch.sellingPrice)) &&
    newBatch.packId !== "" &&
    newBatch.packTypeUnitId !== "" &&
    Number(newBatch.unitPerPack) > 0 &&
    Number(newBatch.numberOfPacks) > 0 &&
    Number(newBatch.minimumOrderQuantity) > 0 &&
    Number(newBatch.maximumOrderQuantity) >= Number(newBatch.minimumOrderQuantity);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!productId) {
      setSubmitError("Missing product ID — cannot create batch.");
      return;
    }
    if (!isValid) return;

    setSubmitError(null);
    try {
      setSubmitting(true);
      const response = await addStock({
        productId,
        // A new batch always creates its own packaging variant, so packagingId is
        // intentionally omitted here — packagingDetails takes precedence server-side.
        packagingDetails: {
          packId: Number(newBatch.packId),
          packTypeUnitId: Number(newBatch.packTypeUnitId),
          unitPerPack: Number(newBatch.unitPerPack),
          numberOfPacks: Number(newBatch.numberOfPacks),
          packSize: Number(newBatch.packSize),
          minimumOrderQuantity: Number(newBatch.minimumOrderQuantity),
          maximumOrderQuantity: Number(newBatch.maximumOrderQuantity),
        },
        batchLotNumber: newBatch.batchLotNumber.trim(),
        manufacturingDate: `${newBatch.manufacturingDate}T00:00:00`,
        expiryDate: `${newBatch.expiryDate}T00:00:00`,
        quantity: Number(newBatch.quantity),
        mrp: Number(newBatch.mrp),
        sellingPrice: Number(newBatch.sellingPrice),
        referenceType: "MANUAL_STOCK_UPDATE",
      });
      setResult({
        batchNumber: response.batchLotNumber,
        updatedStock: response.balanceAfter,
      });
      onSuccess?.(response);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
                  Add New Batch
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
            <div style={{ padding: "24px", minHeight: 200, display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field label="Batch / Lot Number">
                  <input
                    type="text"
                    value={newBatch.batchLotNumber}
                    onChange={(e) => handleBatchLotNumberChange(e.target.value)}
                    placeholder="e.g. BATCH-2026-01"
                    style={{
                      ...inputStyle,
                      border: `1px solid ${batchNumberError ? "#FCA5A5" : BORDER}`,
                    }}
                  />
                  {checkingBatchNumber ? (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: TEXT_GRAY }}>
                      Checking batch ID…
                    </p>
                  ) : batchNumberError ? (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#B91C1C" }}>
                      {batchNumberError}
                    </p>
                  ) : null}
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    value={newBatch.quantity}
                    onChange={(e) =>
                      setNewBatch((v) => ({ ...v, quantity: e.target.value }))
                    }
                    placeholder="Enter quantity"
                    style={inputStyle}
                  />
                </Field>
                <Field label="MRP (₹)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newBatch.mrp}
                    onChange={(e) =>
                      setNewBatch((v) => ({ ...v, mrp: e.target.value }))
                    }
                    placeholder="Enter MRP"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Selling Price (₹)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newBatch.sellingPrice}
                    onChange={(e) =>
                      setNewBatch((v) => ({ ...v, sellingPrice: e.target.value }))
                    }
                    placeholder="Enter selling price"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Manufacturing Date">
                  <input
                    type="date"
                    value={newBatch.manufacturingDate}
                    onChange={(e) =>
                      setNewBatch((v) => ({ ...v, manufacturingDate: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>
                <Field label="Expiry Date">
                  <input
                    type="date"
                    value={newBatch.expiryDate}
                    onChange={(e) =>
                      setNewBatch((v) => ({ ...v, expiryDate: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: TEXT_DARK,
                    fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  Packaging / Variant Details
                </p>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: TEXT_GRAY }}>
                  A new batch creates its own pack-size variant.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <Field label="Pack Type">
                    <select
                      value={newBatch.packId}
                      onChange={(e) =>
                        setNewBatch((v) => ({ ...v, packId: e.target.value }))
                      }
                      style={inputStyle}
                    >
                      <option value="">Select pack type</option>
                      {packTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Pack Type Unit">
                    <select
                      value={newBatch.packTypeUnitId}
                      onChange={(e) =>
                        setNewBatch((v) => ({ ...v, packTypeUnitId: e.target.value }))
                      }
                      style={inputStyle}
                    >
                      <option value="">Select unit</option>
                      {packTypeUnitOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Unit Per Pack">
                    <input
                      type="number"
                      min={1}
                      value={newBatch.unitPerPack}
                      onChange={(e) =>
                        handleUnitPerPackOrCountChange("unitPerPack", e.target.value)
                      }
                      placeholder="e.g. 15"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Number of Packs">
                    <input
                      type="number"
                      min={1}
                      value={newBatch.numberOfPacks}
                      onChange={(e) =>
                        handleUnitPerPackOrCountChange("numberOfPacks", e.target.value)
                      }
                      placeholder="e.g. 100"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Pack Size (auto-calculated)">
                    <input
                      type="number"
                      value={newBatch.packSize}
                      readOnly
                      placeholder="Unit Per Pack × Number of Packs"
                      style={{ ...inputStyle, background: "#F5F5F5", color: TEXT_GRAY }}
                    />
                  </Field>
                  <Field label="Minimum Order Quantity">
                    <input
                      type="number"
                      min={1}
                      value={newBatch.minimumOrderQuantity}
                      onChange={(e) =>
                        setNewBatch((v) => ({
                          ...v,
                          minimumOrderQuantity: e.target.value,
                        }))
                      }
                      placeholder="e.g. 5"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Maximum Order Quantity">
                    <input
                      type="number"
                      min={1}
                      value={newBatch.maximumOrderQuantity}
                      onChange={(e) =>
                        setNewBatch((v) => ({
                          ...v,
                          maximumOrderQuantity: e.target.value,
                        }))
                      }
                      placeholder="e.g. 500"
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>

              {submitError && (
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
                {submitting ? "Creating…" : "Add Batch"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
          Batch Created Successfully!
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, color: TEXT_GRAY }}>Stock Quantity</span>
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
