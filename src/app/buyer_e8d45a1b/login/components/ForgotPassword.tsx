"use client";

import { useState } from "react";
import Image from "next/image";
import { TbMailFilled } from "react-icons/tb";
import { toast } from "react-toastify";

interface ForgotPasswordProps {
  onSubmitted: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPassword({ onSubmitted, onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");

  // Buyer accounts have no forgot-password API yet (unlike seller), so this
  // just walks the user through the same screens as a front-end-only demo.
  const handleSubmit = () => {
    if (!email) return;
    toast.success("OTP sent to your email!");
    onSubmitted(email);
  };

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-h5 font-medium text-center text-pneutral-900 mb-2 font-heading">Forgot Password</h2>

      <p className="text-sm text-pneutral-600 text-center mb-6">
        Enter your email. An OTP will be send to your email address.
      </p>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <TbMailFilled className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="off"
            className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!email}
        className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 bg-primary-800 text-pneutral-50 disabled:cursor-not-allowed"
      >
        Verify
      </button>

      <button onClick={onBack} className="text-sm text-center w-full text-primary-700 hover:underline">
        ← Back to Login
      </button>
    </div>
  );
}
