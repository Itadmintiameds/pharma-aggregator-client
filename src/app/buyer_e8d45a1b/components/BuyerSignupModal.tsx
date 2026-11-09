"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBuyerLoginModal } from "../context/BuyerLoginModalContext";
import SignupForm from "../signup/components/SignupForm";
import SignupOtpStep from "../signup/components/SignupOtpStep";

type SignupStep = "SIGNUP" | "OTP";

export default function BuyerSignupModal() {
  const { isSignupOpen, closeSignupModal } = useBuyerLoginModal();
  const [step, setStep] = useState<SignupStep>("SIGNUP");
  const [email, setEmail] = useState("");

  // Reset back to the signup form once the popup is closed, so reopening it
  // later doesn't resume mid-OTP from a previous attempt.
  useEffect(() => {
    if (!isSignupOpen) {
      setStep("SIGNUP");
      setEmail("");
    }
  }, [isSignupOpen]);

  useEffect(() => {
    document.body.style.overflow = isSignupOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSignupOpen]);

  if (!isSignupOpen) return null;

  // SignupOtpStep renders VerificationModal, which is already its own
  // fixed full-screen overlay — rendering it inside another backdrop here
  // would stack two dark overlays, so it's returned unwrapped.
  if (step === "OTP") {
    return <SignupOtpStep email={email} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur">
      <div className="relative w-full max-w-[28rem]">
        <button
          onClick={closeSignupModal}
          className="absolute -top-14 right-0 bg-secondary-700 text-pneutral-50 px-4 py-2 rounded-md flex items-center gap-2 transition shadow-lg"
        >
          <X size={16} />
          Close
        </button>

        <SignupForm
          onOtpSent={(signedUpEmail) => {
            setEmail(signedUpEmail);
            setStep("OTP");
          }}
        />
      </div>
    </div>
  );
}
