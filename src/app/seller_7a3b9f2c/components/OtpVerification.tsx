"use client";
import React, { useRef, useState, useEffect } from "react";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

interface Props {
  show: boolean;
  label: string;
  type: "email" | "phone";
  onClose: () => void;
  onVerified: () => void;
  onResend: () => Promise<void>;
  isTransitioning?: boolean;
}

export default function VerificationModal({ 
  show, 
  label, 
  onClose, 
  onVerified, 
  type, 
  onResend,
  isTransitioning = false
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

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    
    if (clean.startsWith("91") && clean.length === 12) {
      return `+${clean}`;
    }

    if (clean.length === 10) {
      return `+91${clean}`;
    }

    return `+${clean}`;
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    if (value && index === 5) {
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        setTimeout(async () => {
          setIsVerifying(true);
          try {
            if (type === "email") {
              await sellerRegService.verifyEmailOtp({
                email: label,
                otp: enteredOtp
              });
            } else {
              const phoneWithPrefix = formatPhone(label);
              // await sellerRegService.verifySMSOtp({
              //   phone: phoneWithPrefix,
              //   otp: enteredOtp
              // });
            }
            onVerified();
          } catch (error: any) {
            console.error('❌ Verification failed:', error);
            setError(error.message || "Invalid OTP. Please try again.");
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => {
              inputs.current[0]?.focus();
            }, 50);
          } finally {
            setIsVerifying(false);
          }
        }, 50);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    
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
      
      setTimeout(async () => {
        setIsVerifying(true);
        try {
          if (type === "email") {
            await sellerRegService.verifyEmailOtp({
              email: label,
              otp: pasteData
            });
          } else {
            const phoneWithPrefix = formatPhone(label);
            // await sellerRegService.verifySMSOtp({
            //   phone: phoneWithPrefix,
            //   otp: pasteData
            // });
          }
          onVerified();
        } catch (error: any) {
          console.error('❌ Verification failed:', error);
          setError(error.message || "Invalid OTP. Please try again.");
          setOtp(["", "", "", "", "", ""]);
        } finally {
          setIsVerifying(false);
        }
      }, 50);
      
      setTimeout(() => {
        inputs.current[5]?.focus();
      }, 10);
    } else {
      setError("Please paste a valid 6-digit code");
    }
  };

  const verify = async () => {
    const enteredOtp = otp.join("");
    
    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    
    setIsVerifying(true);
    setError("");
    
    try {
      if (type === "email") {
        await sellerRegService.verifyEmailOtp({
          email: label,
          otp: enteredOtp
        });
      } else {
        const phoneWithPrefix = formatPhone(label);
        // await sellerRegService.verifySMSOtp({
        //   phone: phoneWithPrefix,
        //   otp: enteredOtp
        // });
      }
      
      onVerified();
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      setError(error.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendCountdown(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    
    try {
      await onResend();
      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
    } catch (error: any) {
      console.error('❌ Failed to resend OTP:', error);
      setError(error.message || "Failed to resend code. Please try again.");
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className={`w-[360px] bg-white rounded-xl shadow-lg p-8 text-center transform transition-all duration-500 ease-in-out ${
          isTransitioning 
            ? 'opacity-0 scale-95 translate-y-4' 
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: show && !isTransitioning ? 'fadeInScale 0.3s ease-out' : 'none'
        }}
      >
        <style jsx>{`
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

        {/* Icon with slide animation */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-500 transform ${
              isTransitioning ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
            } ${type === "email" ? "bg-purple-200" : "bg-red-200"}`}
          >
            {type === "email" ? (
              <i className="bi bi-envelope text-3xl text-purple-700"></i>
            ) : (
              <i className="bi bi-chat-dots text-3xl text-neutral-800"></i>
            )}
          </div>
        </div>

        {/* Title with slide animation */}
        <div className="overflow-hidden mb-1">
          <h2 
            className={`text-2xl font-semibold text-neutral-900 transition-all duration-500 transform ${
              isTransitioning ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {type === "email" ? "Verify your email" : "Verify your mobile number"}
          </h2>
        </div>

        {/* Subtitle with slide animation */}
        <div className="overflow-hidden mb-2">
          <p 
            className={`text-sm text-neutral-600 transition-all duration-500 delay-75 transform ${
              isTransitioning ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            We just sent you a verification code to your{" "}
            {type === "email" ? "email id" : "phone number"}
          </p>
        </div>

        {/* Email/Phone with slide animation */}
        <div className="overflow-hidden mb-4">
          <p 
            className={`text-sm font-medium text-purple-700 transition-all duration-500 delay-100 transform ${
              isTransitioning ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {label}
          </p>
        </div>

        {/* OTP Label with slide animation */}
        <div className="overflow-hidden mb-4">
          <p 
            className={`text-xl font-medium text-neutral-800 transition-all duration-500 delay-150 transform ${
              isTransitioning ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            Enter your OTP code here
          </p>
        </div>

        {/* OTP Inputs with staggered animation */}
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={isTransitioning}
              className={`w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-300 transform ${
                isTransitioning 
                  ? 'opacity-0 scale-90' 
                  : 'opacity-100 scale-100'
              }`}
              style={{
                transitionDelay: isTransitioning ? '0ms' : `${index * 30}ms`
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 mb-4 animate-pulse">
            {error}
          </p>
        )}

        {/* Verify Button with slide animation */}
        <div className="overflow-hidden mb-2">
          <button
            onClick={verify}
            disabled={isVerifying || otp.join("").length !== 6 || isTransitioning}
            className={`w-full py-3 rounded-lg bg-purple-800 text-white font-medium hover:bg-purple-900 transition-all duration-500 transform ${
              isTransitioning 
                ? 'translate-y-4 opacity-0' 
                : 'translate-y-0 opacity-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              transitionDelay: isTransitioning ? '0ms' : '200ms'
            }}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </div>

        {/* Resend with slide animation */}
        <div className="overflow-hidden">
          <div 
            className={`mt-5 text-sm transition-all duration-500 delay-300 transform ${
              isTransitioning ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <p className="text-neutral-500">Didn't receive the OTP?</p>

            <button
              onClick={handleResendCode}
              disabled={!canResend || isTransitioning}
              className="text-red-500 font-medium mt-1 hover:underline disabled:text-neutral-400"
            >
              {canResend ? "Resend OTP" : `Resend in ${resendCountdown}s`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}