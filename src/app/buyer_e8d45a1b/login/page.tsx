"use client";

import { useState } from "react";
import AuthCarousel from "./components/AuthCarousel";
import LoginForm from "./components/LoginForm";
import LoginOtpStep from "./components/LoginOtpStep";
import ForgotPassword from "./components/ForgotPassword";
import ForgotPasswordOtpStep from "./components/ForgotPasswordOtpStep";
import ResetPasswordStep from "./components/ResetPasswordStep";

type LoginStep = "LOGIN" | "OTP" | "FORGOT_PASSWORD" | "FORGOT_PASSWORD_OTP" | "RESET_PASSWORD";

export default function BuyerLoginPage() {
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [tempCredentials, setTempCredentials] = useState({ username: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");

  const handleOtpSent = (username: string, password: string) => {
    setTempCredentials({ username, password });
    setStep("OTP");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-6">
      <div className="w-full max-w-5xl">
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
