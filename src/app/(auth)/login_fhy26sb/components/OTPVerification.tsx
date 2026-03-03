"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OTPVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/seller/verify-otp", {
        method: "POST",
        body: JSON.stringify({ otp }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Invalid OTP");
      }

      router.push("/seller/dashboard");
    } catch (err) {
      setError("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">OTP Verification</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="text"
        placeholder="Enter OTP"
        className="border p-2 w-full rounded"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button
        onClick={verifyOtp}
        disabled={loading}
        className="bg-purple-600 text-white w-full p-2 rounded"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </div>
  );
}