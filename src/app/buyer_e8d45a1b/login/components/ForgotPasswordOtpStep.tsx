"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

interface ForgotPasswordOtpStepProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function ForgotPasswordOtpStep({ email, onVerified, onBack }: ForgotPasswordOtpStepProps) {
  const [otp, setOtp] = useState(Array(6).fill(""));
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

  // No backend to verify against yet — any complete 6-digit code proceeds.
  const handleVerify = () => {
    if (!isOtpValid) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    onVerified();
  };

  const handleResend = () => {
    setOtp(Array(6).fill(""));
    toast.success("OTP resent to your email!");
    inputRefs.current[0]?.focus();
  };

  return (
    <div onPaste={handlePaste}>
      <div className="mb-6 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-2xl font-semibold text-center text-pneutral-900 mb-2">Verify Your Email</h2>

      <p className="text-sm text-pneutral-900 text-center mb-1">We just sent a verification code to</p>
      <div className="text-center mb-3">
        <p className="text-xs text-pneutral-700">{email}</p>
      </div>

      <p className="text-center font-semibold text-pneutral-900 mb-4">Enter your OTP here</p>

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
          />
        ))}
      </div>

      <p className="text-center text-m text-pneutral-900">Didn&apos;t receive the OTP?</p>
      <button
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
        onClick={handleResend}
      >
        Resend OTP
      </button>

      <button
        onClick={handleVerify}
        disabled={!isOtpValid}
        className="w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 bg-primary-800 text-pneutral-50 disabled:cursor-not-allowed"
      >
        Verify OTP
      </button>

      <button onClick={onBack} className="text-sm text-center mt-3 text-primary-700 hover:underline w-full">
        ← Back to Forgot Password
      </button>
    </div>
  );
}
