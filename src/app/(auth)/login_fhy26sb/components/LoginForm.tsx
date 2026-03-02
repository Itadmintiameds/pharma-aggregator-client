"use client";

import { useState } from "react";

interface LoginFormProps {
  setStep: (step: "LOGIN" | "OTP" | "RESET_PASSWORD" | "FORGOT_PASSWORD") => void;
}

export default function LoginForm({ setStep }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/seller/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (data.firstLogin) {
        setStep("RESET_PASSWORD");
      } else {
        setStep("OTP");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Seller Login</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        placeholder="Registered Email"
        className="border p-2 w-full rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 text-white w-full p-2 rounded"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <button
        onClick={() => setStep("FORGOT_PASSWORD")}
        className="text-blue-600 text-sm"
      >
        Forgot Password?
      </button>
    </div>
  );
}