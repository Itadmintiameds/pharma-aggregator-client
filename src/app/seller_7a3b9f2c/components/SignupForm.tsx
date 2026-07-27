"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import VerificationModal from "./OtpModalSixBox";
import { sellerAuthService } from "@/src/services/seller/authService";
import { signupSchema } from "@/src/schema/seller/signupSchema";

interface Props {
  onOpenLogin: () => void;
}

export default function SignupForm({ onOpenLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const handleGetOtp = async () => {
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await sellerAuthService.sendSignupOtp({ email, password });
      setShowOtpModal(true);
      toast.success("OTP sent to your email");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    await sellerAuthService.verifySignupOtp({ email, otp });
  };

  const handleVerified = () => {
    setShowOtpModal(false);
    toast.success("Account created successfully");
    setSignupComplete(true);
  };

  const handleResend = async () => {
    await sellerAuthService.sendSignupOtp({ email, password });
  };

  if (signupComplete) {
    return (
      <div className="w-full max-w-[28rem] mx-auto bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-h4 font-heading font-medium text-pneutral-900 mb-2">
          Account created
        </h2>
        <p className="text-p3 font-body text-pneutral-600 mb-6">
          Your seller account has been created. Please log in with your email and password to continue your registration.
        </p>
        <button
          onClick={onOpenLogin}
          className="w-full py-3 rounded-xl bg-primary-800 text-white font-semibold"
        >
          Log in now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[28rem] mx-auto bg-white rounded-xl shadow-md p-8">
      <h2 className="text-h4 font-heading font-medium text-pneutral-900 mb-1">
        Create your seller account
      </h2>
      <p className="text-p3 font-body text-pneutral-600 mb-6">
        Sign up with your email and password to start your seller registration.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          {errors.email && <p className="text-red-500 text-p3 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-p3 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-p3 mt-1">{errors.confirmPassword}</p>}
        </div>

        <button
          onClick={handleGetOtp}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-60"
        >
          {submitting ? "Sending OTP..." : "Get OTP"}
        </button>
      </div>

      <p className="text-center text-p3 font-body text-pneutral-600 mt-6">
        Already have an account?{" "}
        <button onClick={onOpenLogin} className="text-primary-800 font-semibold">
          Log in
        </button>
      </p>

      <VerificationModal
        show={showOtpModal}
        label={email}
        type="email"
        onClose={() => setShowOtpModal(false)}
        onVerified={handleVerified}
        onResend={handleResend}
        onVerify={handleVerifyOtp}
      />
    </div>
  );
}
