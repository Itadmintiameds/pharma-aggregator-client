"use client";

import React from "react";
import { type OfferWindowInput, offerWindowError } from "@/src/utils/offerWindow";

const BORDER = "#D5D5D4";
const TEXT_DARK = "#1E1E1D";
const TEXT_GRAY = "#5A5B58";

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
  background: "white",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 500,
  color: TEXT_DARK,
  marginBottom: 4,
};

/** Start/end date + time of an offer. All optional; times are IST. */
export default function OfferWindowFields({
  value,
  onChange,
}: {
  value: OfferWindowInput;
  onChange: (patch: Partial<OfferWindowInput>) => void;
}) {
  const error = offerWindowError(value);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>Start date</label>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Start time</label>
          <input
            type="time"
            value={value.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>End date</label>
          <input
            type="date"
            value={value.endDate}
            min={value.startDate || undefined}
            onChange={(e) => onChange({ endDate: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>End time</label>
          <input
            type="time"
            value={value.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 11.5, color: error ? "#B91C1C" : TEXT_GRAY }}>
        {error ??
          "Optional, India time (IST). Leave blank for no limit; without an end time the offer runs through the whole end date."}
      </p>
    </div>
  );
}
