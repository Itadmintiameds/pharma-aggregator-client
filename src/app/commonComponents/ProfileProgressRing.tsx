"use client";

import React from "react";

interface ProfileProgressRingProps {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  children: React.ReactNode;
}

export default function ProfileProgressRing({
  percent,
  color,
  size = 44,
  strokeWidth = 3,
  trackColor = "#E5E7EB",
  children,
}: ProfileProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: strokeWidth + 1,
          left: strokeWidth + 1,
          right: strokeWidth + 1,
          bottom: strokeWidth + 1,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <span
        style={{
          position: "absolute",
          bottom: -3,
          right: -6,
          fontSize: 9,
          fontWeight: 700,
          lineHeight: "12px",
          color,
          background: "white",
          border: `1px solid ${color}`,
          borderRadius: 999,
          padding: "0 4px",
          whiteSpace: "nowrap",
        }}
      >
        {clamped}%
      </span>
    </div>
  );
}
