"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { buyerResetPasswordSchema, BuyerResetPasswordFormValues } from "@/src/schema/buyer/authSchema";

interface ResetPasswordStepProps {
  onDone: () => void;
}

export default function ResetPasswordStep({ onDone }: ResetPasswordStepProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BuyerResetPasswordFormValues>({
    resolver: zodResolver(buyerResetPasswordSchema),
    mode: "onChange",
  });

  // No reset-password API for buyers yet — this just completes the visual flow.
  const onSubmit = () => {
    toast.success("Password reset successful! Please login with your new password.");
    onDone();
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
          Password must be at least 8 characters with uppercase, lowercase, number and special character
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
        disabled={!isValid}
        className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 bg-primary-800 text-pneutral-50 disabled:opacity-60"
      >
        Change Password
      </button>
    </form>
  );
}
