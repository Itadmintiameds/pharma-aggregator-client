"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { buyerSignupSchema, BuyerSignupFormValues } from "@/src/schema/buyer/authSchema";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";

interface SignupFormProps {
  onOtpSent: (email: string, phone: string) => void;
}

export default function SignupForm({ onOtpSent }: SignupFormProps) {
  const { openLoginModal } = useBuyerLoginModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyerSignupFormValues>({
    resolver: zodResolver(buyerSignupSchema),
  });

  const onSubmit = async (values: BuyerSignupFormValues) => {
    try {
      setLoading(true);
      setError("");

      await buyerAuthService.sendSignupOtp({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      onOtpSent(values.email, values.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[28rem] mx-auto bg-white rounded-xl border border-neutral-200 shadow-md px-5 py-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary-900">
        BUYER ACCOUNT
      </span>
      <h2 className="mt-1.5 text-xl font-heading font-bold text-pneutral-900">Create your buyer account</h2>
      <p className="mb-3 text-xs text-neutral-500">Sign up with your email, phone and password to get started.</p>

      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</p>}

      <form className="space-y-2.5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-0.5 block text-xs font-heading font-semibold text-pneutral-900">
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-[13px] focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("fullName")}
            />
          </div>
          {errors.fullName && <p className="mt-0.5 text-[11px] text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-heading font-semibold text-pneutral-900">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-[13px] focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="mt-0.5 text-[11px] text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-heading font-semibold text-pneutral-900">
            Phone
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-[13px] focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("phone")}
            />
          </div>
          {errors.phone && <p className="mt-0.5 text-[11px] text-red-500">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-heading font-semibold text-pneutral-900">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-10 text-[13px] focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-800"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-0.5 text-[11px] text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-0.5 block text-xs font-heading font-semibold text-pneutral-900">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-10 text-[13px] focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-800"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-lg border-[1.5px] border-primary-800 text-[13px] font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
        >
          {loading ? "Sending OTP..." : "Get OTP"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-pneutral-600">
        Already have an account?{" "}
        <button type="button" onClick={openLoginModal} className="font-semibold text-primary-800 hover:underline">
          Log in
        </button>
      </p>
    </div>
  );
}
