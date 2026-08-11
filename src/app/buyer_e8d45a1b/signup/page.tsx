"use client";

import { useState } from "react";
import BuyerAuthHeader from "../components/BuyerAuthHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import SignupForm from "./components/SignupForm";
import SignupOtpStep from "./components/SignupOtpStep";

type SignupStep = "SIGNUP" | "OTP";

export default function BuyerSignupPage() {
  const [step, setStep] = useState<SignupStep>("SIGNUP");
  const [email, setEmail] = useState("");

  const handleOtpSent = (signedUpEmail: string) => {
    setEmail(signedUpEmail);
    setStep("OTP");
  };

  return (
    <>
      <BuyerAuthHeader />

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 pt-24 pb-24 px-4">
        {step === "SIGNUP" && <SignupForm onOtpSent={handleOtpSent} />}
        {step === "OTP" && <SignupOtpStep email={email} />}
      </div>

      <Footer />
    </>
  );
}
