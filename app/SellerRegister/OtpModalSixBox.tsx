"use client";
import React, { useRef, useState, useEffect } from "react";

interface Props {
  show: boolean;
  label: string;
  type: "email" | "phone";
  onClose: () => void;
  onVerified: () => void;
  expectedOtp: string | null;
  onResend: () => void;
}

export default function VerificationModal({ 
  show, 
  label, 
  onClose, 
  onVerified, 
  type, 
  expectedOtp,
  onResend 
}: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState<string>("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (show) {
      setOtp(["", "", "", "", "", ""]);
      setIsVerifying(false);
      setError("");
      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
    }
  }, [show]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown, canResend]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(""); // Clear error when user types
    
    // Auto-advance to next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Auto-submit if last digit is entered
    if (value && index === 5) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const enteredOtp = [...newOtp].join("");
        if (enteredOtp.length === 6) {
          verify();
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    
    // Navigate with arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp as string[]);
      setError("");
      setTimeout(() => {
        inputs.current[5]?.focus();
      }, 10);
    } else {
      setError("Please paste a valid 6-digit code");
    }
  };

  const verify = () => {
    const enteredOtp = otp.join("");
    
    // Validate OTP length
    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    
    // Validate OTP format
    if (!/^\d{6}$/.test(enteredOtp)) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    
    // Check if expected OTP is available
    if (!expectedOtp) {
      setError("OTP expired. Please request a new one.");
      return;
    }
    
    // Compare entered OTP with expected OTP
    if (enteredOtp !== expectedOtp) {
      setError("Invalid OTP. Please try again.");
      
      // Clear OTP fields and focus on first input
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
      
      return;
    }
    
    // OTP is correct
    setIsVerifying(true);
    setTimeout(() => {
      onVerified();
      onClose();
      setIsVerifying(false);
    }, 800);
  };

  const handleResendCode = () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendCountdown(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    
    // Call parent resend function
    onResend();
    
    // Focus on first input
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 50);
  };

  const clearError = () => {
    setError("");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-[320px]">
        <div className="relative rounded-lg shadow-xl overflow-hidden bg-white border-2 border-blue-100">
          {/* Header */}
          <div className="p-3 text-center bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
              type === "email" ? "bg-blue-100" : "bg-green-100"
            }`}>
              {type === "email" ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <h2 className="text-base font-bold text-gray-800">
              Verify {type === "email" ? "Email" : "Phone"}
            </h2>
            <p className="text-xs text-gray-600">
              Code sent to <span className={`font-medium ${
                type === "email" ? "text-blue-600" : "text-green-600"
              }`}>{label}</span>
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="p-3">
            <div className="flex justify-between gap-1 mb-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onClick={clearError}
                  className="w-9 h-10 text-center text-sm font-bold rounded border bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-300 transition-all"
                  style={{
                    borderColor: error ? '#ef4444' : (digit ? (type === "email" ? '#3b82f6' : '#10b981') : '#d1d5db'),
                    color: error ? '#ef4444' : (digit ? (type === "email" ? '#2563eb' : '#059669') : '#333'),
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-2 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-100 flex items-center">
                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={verify}
              disabled={isVerifying || otp.join("").length !== 6}
              className={`w-full py-2 rounded text-sm font-medium text-white mb-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                type === "email" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-3 w-3 mr-1.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : "Verify"}
            </button>

            {/* Resend Code */}
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={handleResendCode}
                disabled={!canResend}
                className={`text-xs flex items-center ${
                  canResend 
                    ? (type === "email" ? "text-blue-600 hover:text-blue-800" : "text-green-600 hover:text-green-800")
                    : "text-gray-400"
                }`}
              >
                {canResend ? (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend Code
                  </>
                ) : `Resend in ${resendCountdown}s`}
              </button>
              
              <span className="text-xs text-gray-500 italic">
                {expectedOtp ? `Demo: ${expectedOtp}` : "Demo: 6 digits"}
              </span>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500">
                Code expires in 10 min
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}