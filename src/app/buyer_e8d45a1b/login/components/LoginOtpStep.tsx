"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";

interface LoginOtpStepProps {
  username: string;
  password: string;
  onBack: () => void;
}

export default function LoginOtpStep({ username, password, onBack }: LoginOtpStepProps) {
  const router = useRouter();
  const { closeLoginModal } = useBuyerLoginModal();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isOtpValid = otp.join("").length === 6 && /^\d+$/.test(otp.join(""));

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split("");
      const newOtp = [...otp];

      pastedOtp.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);

      const nextEmptyIndex = newOtp.findIndex((d, i) => i > index && !d);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedOtp = pastedData.slice(0, 6).split("");

    const newOtp = [...otp];
    pastedOtp.forEach((digit, index) => {
      if (/^\d$/.test(digit)) {
        newOtp[index] = digit;
      }
    });

    setOtp(newOtp);

    const lastFilledIndex = newOtp.findLastIndex((d) => d);
    if (lastFilledIndex !== -1 && lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isOtpValid) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await buyerAuthService.verifyOtp({ username, otp: otp.join("") });
      toast.success("Login successful!");
      window.dispatchEvent(new Event("buyer-auth-changed"));
      closeLoginModal();
      router.push("/buyer_e8d45a1b/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OTP verification failed");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      setOtp(Array(6).fill(""));
      await buyerAuthService.login({ username, password });
      toast.success("New OTP sent to your email!");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend OTP. Please try login again.");
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div onPaste={handlePaste}>
      <div className="mb-6 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-2xl font-semibold text-center text-pneutral-900 mb-2">Verify your email</h2>

      <p className="text-sm text-pneutral-900 text-center mb-1">We just sent a verification code to</p>
      <div className="text-center mb-3">
        <p className="text-xs text-pneutral-500">{username}</p>
      </div>

      <p className="text-center font-semibold text-pneutral-900 mb-4">Enter your OTP code here</p>

      <div className="flex justify-center gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={6}
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading}
          />
        ))}
      </div>

      <p className="text-center text-m text-pneutral-900">Didn&apos;t receive the OTP?</p>
      <button
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
        onClick={handleResendOtp}
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Resend OTP"}
      </button>

      <button
        onClick={handleVerify}
        disabled={!isOtpValid || isLoading}
        className="w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 bg-primary-800 text-pneutral-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Verifying..." : "Verify"}
      </button>

      <button
        onClick={onBack}
        className="text-sm text-center mt-3 text-primary-700 hover:underline w-full"
        disabled={isLoading}
      >
        ← Back to Login
      </button>
    </div>
  );
}
