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
