"use client";

import { useState } from "react";

interface PasswordResetFormProps {
  setStep: (step: "LOGIN") => void;
}

export default function PasswordReset({
  setStep,
}: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/seller/reset-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Reset failed");
      }

      alert("Password reset successful. Please login again.");
      setStep("LOGIN");
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Reset Password</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="password"
        placeholder="New Password"
        className="border p-2 w-full rounded"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        className="border p-2 w-full rounded"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        onClick={handleReset}
        disabled={loading}
        className="bg-green-600 text-white w-full p-2 rounded"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}