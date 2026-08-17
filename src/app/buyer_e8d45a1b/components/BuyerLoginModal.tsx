"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBuyerLoginModal } from "../context/BuyerLoginModalContext";
import AuthCarousel from "../login/components/AuthCarousel";
import LoginForm from "../login/components/LoginForm";
import LoginOtpStep from "../login/components/LoginOtpStep";
import ForgotPassword from "../login/components/ForgotPassword";
import ForgotPasswordOtpStep from "../login/components/ForgotPasswordOtpStep";
import ResetPasswordStep from "../login/components/ResetPasswordStep";

type LoginStep = "LOGIN" | "OTP" | "FORGOT_PASSWORD" | "FORGOT_PASSWORD_OTP" | "RESET_PASSWORD";

export default function BuyerLoginModal() {
  const { isOpen, closeLoginModal } = useBuyerLoginModal();
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [tempCredentials, setTempCredentials] = useState({ username: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");

  // Reset back to the login screen once the popup is closed, so reopening it
  // later doesn't resume mid-OTP/reset from a previous session.
  useEffect(() => {
    if (!isOpen) {
      setStep("LOGIN");
      setTempCredentials({ username: "", password: "" });
      setResetEmail("");
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOtpSent = (username: string, password: string) => {
    setTempCredentials({ username, password });
    setStep("OTP");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur">
      <div className="relative w-full max-w-5xl">
        <button
          onClick={closeLoginModal}
          className="absolute -top-14 right-0 bg-secondary-700 text-pneutral-50 px-4 py-2 rounded-md flex items-center gap-2 transition shadow-lg"
        >
          <X size={16} />
          Close
        </button>

        <div className="bg-primary-100 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
          <AuthCarousel />

          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            {step === "LOGIN" && (
              <LoginForm onOtpSent={handleOtpSent} onForgotPassword={() => setStep("FORGOT_PASSWORD")} />
            )}

            {step === "OTP" && (
              <LoginOtpStep
                username={tempCredentials.username}
                password={tempCredentials.password}
                onBack={() => setStep("LOGIN")}
              />
            )}

            {step === "FORGOT_PASSWORD" && (
              <ForgotPassword
                onSubmitted={(email) => {
                  setResetEmail(email);
                  setStep("FORGOT_PASSWORD_OTP");
                }}
                onBack={() => setStep("LOGIN")}
              />
            )}

            {step === "FORGOT_PASSWORD_OTP" && (
              <ForgotPasswordOtpStep
                email={resetEmail}
                onVerified={() => setStep("RESET_PASSWORD")}
                onBack={() => setStep("FORGOT_PASSWORD")}
              />
            )}

            {step === "RESET_PASSWORD" && <ResetPasswordStep onDone={() => setStep("LOGIN")} />}
          </div>
        </div>
      </div>
    </div>
  );
}
