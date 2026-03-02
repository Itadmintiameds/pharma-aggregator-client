"use client";

import { useState } from "react";

interface ForgotPasswordFormProps {
  setStep: (step: "LOGIN") => void;
}

export default function ForgotPassword({
  setStep,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleForgotPassword = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/seller/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      setMessage("Reset link sent to registered email.");
    } catch {
      setMessage("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Forgot Password</h2>

      {message && <p className="text-sm text-blue-600">{message}</p>}

      <input
        type="email"
        placeholder="Registered Email"
        className="border p-2 w-full rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleForgotPassword}
        disabled={loading}
        className="bg-orange-600 text-white w-full p-2 rounded"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      <button
        onClick={() => setStep("LOGIN")}
        className="text-blue-600 text-sm"
      >
        Back to Login
      </button>
    </div>
  );
}