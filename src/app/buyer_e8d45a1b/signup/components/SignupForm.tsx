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
    <div className="w-full max-w-[25rem] mx-auto bg-white rounded-xl shadow-md p-6">
      <h2 className="text-h4 font-heading font-medium text-pneutral-900 mb-1">
        Create your buyer account
      </h2>
      <p className="text-p3 font-body text-pneutral-600 mb-6">
        Sign up with your email, phone and password to get started.
      </p>

      {error && <p className="text-red-500 text-p3 mb-4">{error}</p>}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Your full name"
              className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              {...register("fullName")}
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-p3 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-red-500 text-p3 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Phone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="tel"
              placeholder="10-digit mobile number"
              className="w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              {...register("phone")}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-p3 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-p3 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-label-l4 font-heading font-medium text-pneutral-900 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-p3 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Sending OTP..." : "Get OTP"}
        </button>
      </form>

      <p className="text-center text-p3 font-body text-pneutral-600 mt-6">
        Already have an account?{" "}
        <button type="button" onClick={openLoginModal} className="text-primary-800 font-semibold">
          Log in
        </button>
      </p>
    </div>
  );
}
