"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import { toast } from "react-toastify";

interface Props {
  show: boolean;
  email?: string;
  phone?: string;
  onClose: () => void;
  onVerified: (verified: { email: boolean; phone: boolean }) => void;
}

type VerificationStep = 'email' | 'phone' | 'completed';

export default function OtpVerificationModal({ 
  show, 
  email, 
  phone, 
  onClose, 
  onVerified 
}: Props) {
  const [step, setStep] = useState<VerificationStep>('email');
  const [emailOtp, setEmailOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [phoneOtp, setPhoneOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [canResendEmail, setCanResendEmail] = useState(true);
  const [canResendPhone, setCanResendPhone] = useState(true);
  const [emailResendCountdown, setEmailResendCountdown] = useState(0);
  const [phoneResendCountdown, setPhoneResendCountdown] = useState(0);
  
  const emailInputs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputs = useRef<(HTMLInputElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Determine verification flow on mount
  useEffect(() => {
    if (show) {
      // Reset all states
      setEmailOtp(["", "", "", "", "", ""]);
      setPhoneOtp(["", "", "", "", "", ""]);
      setEmailVerified(false);
      setPhoneVerified(false);
      setEmailError("");
      setPhoneError("");
      
      // Set initial step based on what needs verification
      if (email && phone) {
        // Both need verification - start with email
        setStep('email');
        sendEmailOtp();
        sendPhoneOtp(); // Send both OTPs upfront
      } else if (email && !phone) {
        // Only email needs verification
        setStep('email');
        sendEmailOtp();
      } else if (!email && phone) {
        // Only phone needs verification
        setStep('phone');
        sendPhoneOtp();
      }
      
      setTimeout(() => {
        if (step === 'email' && emailInputs.current[0]) {
          emailInputs.current[0]?.focus();
        } else if (step === 'phone' && phoneInputs.current[0]) {
          phoneInputs.current[0]?.focus();
        }
      }, 50);
    }
  }, [show, email, phone]);

  const sendEmailOtp = async () => {
    if (!email) return;
    try {
      await sellerRegService.sendEmailOtp({ email });
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      toast.error('Failed to send email verification code');
    }
  };

  const sendPhoneOtp = async () => {
    if (!phone) return;
    try {
      const phoneWithPrefix = `+91${phone}`;
      await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
    } catch (error) {
      console.error('Failed to send phone OTP:', error);
      toast.error('Failed to send phone verification code');
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (show && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  // Escape key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (show && event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [show]);

  // Countdown timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailResendCountdown > 0) {
      timer = setTimeout(() => {
        setEmailResendCountdown(emailResendCountdown - 1);
      }, 1000);
    } else if (emailResendCountdown === 0 && !canResendEmail) {
      setCanResendEmail(true);
    }
    return () => clearTimeout(timer);
  }, [emailResendCountdown, canResendEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneResendCountdown > 0) {
      timer = setTimeout(() => {
        setPhoneResendCountdown(phoneResendCountdown - 1);
      }, 1000);
    } else if (phoneResendCountdown === 0 && !canResendPhone) {
      setCanResendPhone(true);
    }
    return () => clearTimeout(timer);
  }, [phoneResendCountdown, canResendPhone]);

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

  const handleEmailOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    setEmailError("");
    
    if (value && index < 5) {
      emailInputs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all digits entered
    if (value && index === 5) {
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        verifyEmailOtp(enteredOtp);
      }
    }
  };

  const handlePhoneOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...phoneOtp];
    newOtp[index] = value;
    setPhoneOtp(newOtp);
    setPhoneError("");
    
    if (value && index < 5) {
      phoneInputs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all digits entered
    if (value && index === 5) {
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        verifyPhoneOtp(enteredOtp);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    type: 'email' | 'phone'
  ) => {
    const otp = type === 'email' ? emailOtp : phoneOtp;
    const inputs = type === 'email' ? emailInputs : phoneInputs;
    
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

  const handlePaste = (e: React.ClipboardEvent, type: 'email' | 'phone') => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pasteData)) {
      if (type === 'email') {
        setEmailOtp(pasteData.split('') as string[]);
        verifyEmailOtp(pasteData);
      } else {
        setPhoneOtp(pasteData.split('') as string[]);
        verifyPhoneOtp(pasteData);
      }
    } else {
      toast.error("Please paste a valid 6-digit code");
    }
  };

  const verifyEmailOtp = async (otp: string) => {
    if (!email) return;
    
    setIsVerifying(true);
    setEmailError("");
    
    try {
      await sellerRegService.verifyEmailOtp({
        email,
        otp
      });
      
      setEmailVerified(true);
      toast.success("Email verified successfully");
      
      // Move to phone verification if phone exists and not verified
      if (phone && !phoneVerified) {
        setStep('phone');
        setTimeout(() => {
          phoneInputs.current[0]?.focus();
        }, 50);
      } else {
        setStep('completed');
        setTimeout(() => {
          onVerified({ email: true, phone: phoneVerified });
        }, 500);
      }
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setEmailError(error.message || "Invalid OTP. Please try again.");
      setEmailOtp(["", "", "", "", "", ""]);
      emailInputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyPhoneOtp = async (otp: string) => {
    if (!phone) return;
    
    setIsVerifying(true);
    setPhoneError("");
    
    try {
      const phoneWithPrefix = formatPhone(phone);
      await sellerRegService.verifySMSOtp({
        phone: phoneWithPrefix,
        otp
      });
      
      setPhoneVerified(true);
      toast.success("Phone verified successfully");
      
      // Check if email also needs verification and is not yet verified
      if (email && !emailVerified) {
        setStep('email');
        setTimeout(() => {
          emailInputs.current[0]?.focus();
        }, 50);
      } else {
        setStep('completed');
        setTimeout(() => {
          onVerified({ email: emailVerified, phone: true });
        }, 500);
      }
    } catch (error: any) {
      console.error('Phone verification failed:', error);
      setPhoneError(error.message || "Invalid OTP. Please try again.");
      setPhoneOtp(["", "", "", "", "", ""]);
      phoneInputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!canResendEmail || !email) return;
    
    setCanResendEmail(false);
    setEmailResendCountdown(30);
    setEmailOtp(["", "", "", "", "", ""]);
    setEmailError("");
    
    try {
      await sellerRegService.sendEmailOtp({ email });
      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleResendPhone = async () => {
    if (!canResendPhone || !phone) return;
    
    setCanResendPhone(false);
    setPhoneResendCountdown(30);
    setPhoneOtp(["", "", "", "", "", ""]);
    setPhoneError("");
    
    try {
      const phoneWithPrefix = formatPhone(phone);
      await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleClose = () => {
    if (emailVerified || phoneVerified) {
      onVerified({ email: emailVerified, phone: phoneVerified });
    }
    onClose();
  };

  if (!show) return null;

  const getStepIcon = () => {
    if (step === 'email') return "/icons/emailVerIcon.png";
    if (step === 'phone') return "/icons/mobVerIcon.png";
    return "/icons/success-icon.png";
  };

  const getStepTitle = () => {
    if (step === 'email') return "Verify your email";
    if (step === 'phone') return "Verify your mobile number";
    return "Verification Complete";
  };

  const getStepSubtitle = () => {
    if (step === 'email') return `We sent a verification code to ${email}`;
    if (step === 'phone') return `We sent a verification code to +91-${phone}`;
    return "All verifications completed successfully";
  };

  const getStepIconBg = () => {
    if (step === 'email') return "bg-purple-200";
    if (step === 'phone') return "bg-red-200";
    return "bg-green-200";
  };

  const renderProgress = () => {
    if (!email || !phone) return null;
    
    return (
      <div className="flex justify-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${emailVerified ? 'bg-green-500' : step === 'email' ? 'bg-purple-600' : 'bg-gray-300'}`} />
        <div className={`w-2 h-2 rounded-full ${phoneVerified ? 'bg-green-500' : step === 'phone' ? 'bg-purple-600' : 'bg-gray-300'}`} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div 
        ref={modalRef}
        className="w-96 bg-white rounded-xl shadow-lg p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Indicator - only show if both need verification */}
        {email && phone && renderProgress()}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${getStepIconBg()}`}
          >
            <Image
              src={getStepIcon()}
              alt="Verification Icon"
              width={85}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-neutral-900 mb-1">
          {getStepTitle()}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-neutral-600 mb-6">
          {getStepSubtitle()}
        </p>

        {step === 'email' && email && (
          <>
            {/* Email OTP Inputs */}
            <div className="flex justify-center gap-2 mb-6">
              {emailOtp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    emailInputs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleEmailOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'email')}
                  onPaste={(e) => handlePaste(e, 'email')}
                  disabled={isVerifying}
                  className="w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                />
              ))}
            </div>

            {/* Error Message */}
            {emailError && (
              <p className="text-sm text-red-500 mb-4">
                {emailError}
              </p>
            )}

            {/* Resend */}
            <div className="mb-4">
              <button
                onClick={handleResendEmail}
                disabled={!canResendEmail}
                className="text-warning-500 font-medium hover:underline disabled:text-neutral-400"
              >
                {canResendEmail ? "Resend OTP" : `Resend in ${emailResendCountdown}s`}
              </button>
            </div>
          </>
        )}

        {step === 'phone' && phone && (
          <>
            {/* Phone OTP Inputs */}
            <div className="flex justify-center gap-2 mb-6">
              {phoneOtp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    phoneInputs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePhoneOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'phone')}
                  onPaste={(e) => handlePaste(e, 'phone')}
                  disabled={isVerifying}
                  className="w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                />
              ))}
            </div>

            {/* Error Message */}
            {phoneError && (
              <p className="text-sm text-red-500 mb-4">
                {phoneError}
              </p>
            )}

            {/* Resend */}
            <div className="mb-4">
              <button
                onClick={handleResendPhone}
                disabled={!canResendPhone}
                className="text-warning-500 font-medium hover:underline disabled:text-neutral-400"
              >
                {canResendPhone ? "Resend OTP" : `Resend in ${phoneResendCountdown}s`}
              </button>
            </div>
          </>
        )}

        {step === 'completed' && (
          <div className="mb-6">
            <p className="text-green-600 font-medium mb-4">
              ✓ {emailVerified && 'Email verified'} 
              {emailVerified && phoneVerified && ' and '}
              {phoneVerified && 'Phone verified'}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-primary-900 text-white rounded-lg font-medium hover:bg-primary-800 transition"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}