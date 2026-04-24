"use client";

import React, { useState } from "react";
import ConsumableForm from "./ConsumableForm";
import NonConsumableForm from "./NonConsumableForm";

const MedicalDevicesForm = () => {
  const [selectedType, setSelectedType] = useState<
    "consumable" | "non-consumable" | null
  >("consumable");



  return (
    <div style={{ marginTop: "clamp(16px, 4vw, 40px)", width: "100%" }}>
      {/* CARD */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 24,
          background: "white",
          borderRadius: 16,
          outline: "1px #D5D5D4 solid",
          outlineOffset: "-1px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            alignSelf: "stretch",
            paddingBottom: 8,
            borderBottom: "1px #D5D5D4 solid",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#1E1E1D",
              fontSize: 28,
              fontFamily: "Open Sans, sans-serif",
              fontWeight: 600,
              lineHeight: "32px",
              wordWrap: "break-word",
            }}
          >
            Product Details
          </h2>
        </div>

        {/* RADIO GROUP */}
        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          {/* Option 1: Consumable */}
          <label
            style={{
              flex: "1 1 0",
              minWidth: 220,
              paddingTop: 8,
              paddingBottom: 8,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="deviceType"
              value="consumable"
              checked={selectedType === "consumable"}
              onChange={() => setSelectedType("consumable")}
              style={{ display: "none" }}
            />
            {/* Custom radio dot */}
            <div style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 9999,
                  background: "white",
                  border: `1.5px solid ${selectedType === "consumable" ? "#4C0080" : "#C0C1BE"}`,
                }}
              />
              {selectedType === "consumable" && (
                <div
                  style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    top: 6,
                    left: 6,
                    borderRadius: 9999,
                    background: "#4C0080",
                  }}
                />
              )}
            </div>
            <span
              style={{
                color: "#1E1E1D",
                fontSize: 16,
                fontFamily: "Open Sans, sans-serif",
                fontWeight: 600,
                lineHeight: "22px",
                wordWrap: "break-word",
              }}
            >
              Consumable Medical Devices &amp; Equipment
            </span>
          </label>

          {/* Option 2: Non-Consumable */}
          <label
            style={{
              flex: "1 1 0",
              minWidth: 220,
              paddingTop: 8,
              paddingBottom: 8,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="deviceType"
              value="non-consumable"
              checked={selectedType === "non-consumable"}
              onChange={() => setSelectedType("non-consumable")}
              style={{ display: "none" }}
            />
            {/* Custom radio dot */}
            <div style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 9999,
                  background: "white",
                  border: `1.5px solid ${selectedType === "non-consumable" ? "#4C0080" : "#C0C1BE"}`,
                }}
              />
              {selectedType === "non-consumable" && (
                <div
                  style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    top: 6,
                    left: 6,
                    borderRadius: 9999,
                    background: "#4C0080",
                  }}
                />
              )}
            </div>
            <span
              style={{
                color: "#1E1E1D",
                fontSize: 16,
                fontFamily: "Open Sans, sans-serif",
                fontWeight: 600,
                lineHeight: "22px",
                wordWrap: "break-word",
              }}
            >
              Non-Consumable Medical Devices &amp; Equipment
            </span>
          </label>
        </div>
      </div>

      {/* FORMS OUTSIDE */}
      <div style={{ marginTop: 24 }}>
        {selectedType === "consumable" && <ConsumableForm />}
        {selectedType === "non-consumable" && <NonConsumableForm />}
      </div>
    </div>
  );
};

export default MedicalDevicesForm;