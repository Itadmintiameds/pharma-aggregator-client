"use client";

import { useState } from "react";
import Image from "next/image";
import { TbMailFilled } from "react-icons/tb";
import { toast } from "react-toastify";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface ForgotPasswordProps {
  onSubmitted: (email: string) => void;
  onBack: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword({ onSubmitted, onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmedEmail = email.trim();
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      await buyerAuthService.forgotPasswordSendOtp(trimmedEmail);
      // The server answers identically for unknown emails, so the wording must not promise delivery.
      toast.success("If this email is registered, a verification code has been sent.");
      onSubmitted(trimmedEmail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-h5 font-medium text-center text-pneutral-900 mb-2 font-heading">Forgot Password</h2>

      <p className="text-sm text-pneutral-600 text-center mb-6">
        Enter your registered email. We will send a verification code to it.
      </p>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <TbMailFilled className="w-5 h-5" />
          </div>
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={submitting}
            className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isEmailValid || submitting}
        className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 bg-primary-800 text-pneutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send OTP"}
      </button>

      <button type="button" onClick={onBack} className="text-sm text-center w-full text-primary-700 hover:underline">
        ← Back to Login
      </button>
    </form>
  );
}
