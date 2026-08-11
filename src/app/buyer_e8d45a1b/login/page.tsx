"use client";

import { useState } from "react";
import BuyerAuthHeader from "../components/BuyerAuthHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import LoginForm from "./components/LoginForm";
import LoginOtpStep from "./components/LoginOtpStep";

type LoginStep = "LOGIN" | "OTP";

export default function BuyerLoginPage() {
  const [step, setStep] = useState<LoginStep>("LOGIN");
  const [username, setUsername] = useState("");

  const handleOtpSent = (loggedInUsername: string) => {
    setUsername(loggedInUsername);
    setStep("OTP");
  };

  return (
    <>
      <BuyerAuthHeader />

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 pt-24 pb-24 px-4">
        {step === "LOGIN" && <LoginForm onOtpSent={handleOtpSent} />}
        {step === "OTP" && <LoginOtpStep username={username} />}
      </div>

      <Footer />
    </>
  );
}
