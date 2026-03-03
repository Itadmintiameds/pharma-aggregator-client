"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import PasswordReset from "./components/PasswordReset";
import OTPVerification from "./components/OTPVerification";
import ForgotPassword from "./components/ForgotPassword";

type AuthStep =
  | "LOGIN"
  | "RESET_PASSWORD"
  | "OTP"
  | "FORGOT_PASSWORD";

export default function SellerLoginPage() {
  const [step, setStep] = useState<AuthStep>("LOGIN");

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <div className="bg-secondary-50 shadow-lg rounded-xl p-8 w-full max-w-md">

        {/* Dynamic Title */}
        {step === "LOGIN" && (
          <LoginForm setStep={setStep} />
        )}

        {step === "RESET_PASSWORD" && (
          <PasswordReset setStep={setStep} />
        )}

        {step === "OTP" && (
          <OTPVerification />
        )}

        {step === "FORGOT_PASSWORD" && (
          <ForgotPassword setStep={setStep} />
        )}

      </div>
    </div>
  );
}