"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { buyerResetPasswordSchema, BuyerResetPasswordFormValues } from "@/src/schema/buyer/authSchema";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface ResetPasswordStepProps {
  email: string;
  onDone: () => void;
  // Set when arriving from "Forgot password": the single-use token from OTP verification.
  // Absent for the first-login temporary-password flow, which keeps its original behaviour.
  resetToken?: string;
  // Lets the forgot-password flow leave this screen if the token has expired.
  onBack?: () => void;
  // First-login flow only: the temporary password the buyer just logged in with, which the
  // server requires to authorise the change (there is no session/token yet at this point).
  currentPassword?: string;
}

export default function ResetPasswordStep({ email, onDone, resetToken, onBack, currentPassword }: ResetPasswordStepProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BuyerResetPasswordFormValues>({
    resolver: zodResolver(buyerResetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: BuyerResetPasswordFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (resetToken) {
        await buyerAuthService.resetForgottenPassword(resetToken, values.newPassword);
      } else {
        if (!currentPassword) {
          throw new Error("Your session has expired. Please log in again.");
        }
        if (values.newPassword === currentPassword) {
          throw new Error("New password must be different from your temporary password.");
        }
        await buyerAuthService.resetPassword({
          username: email,
          currentPassword,
          newPassword: values.newPassword,
        });
      }
      toast.success("Password reset successful! Please login with your new password.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-2xl font-bold text-center text-pneutral-900 mb-2">Set New Password</h2>

      <p className="text-sm text-neutral-600 text-center mb-6">Please set a new password for your account.</p>

      <div className="mb-4">
        <div className="relative">
          <input
            {...register("newPassword")}
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter New Password"
            autoComplete="off"
            className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-warning-500 text-xs mt-1">{errors.newPassword.message}</p>
        )}
        <p className="text-xs text-neutral-400 mt-1">
          Password must be at least 8 characters with uppercase, lowercase, number and one of @ # $ % ^ & + = !
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            autoComplete="off"
            className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-warning-500 text-xs mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 bg-primary-800 text-pneutral-50 disabled:opacity-60"
      >
        {submitting ? "Changing Password..." : "Change Password"}
      </button>

      {resetToken && onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-sm text-center w-full text-primary-700 hover:underline disabled:opacity-50"
        >
          ← Back to Login
        </button>
      )}
    </form>
  );
}
