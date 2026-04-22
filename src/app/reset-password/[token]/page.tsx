"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { z } from "zod";
import { sellerAuthService } from "@/src/services/seller/authService";

const resetPasswordSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    currentPassword: z.string().min(1, "Temporary password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Auto-populate username from URL
  useEffect(() => {
    const usernameFromUrl = searchParams.get("username");
    if (usernameFromUrl) {
      setValue("username", usernameFromUrl);
    }
  }, [searchParams, setValue]);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await sellerAuthService.resetPassword({
        username: data.username,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setResetSuccess(true);
      toast.success("Password reset successful!");

      setTimeout(() => {
        router.push("/?showLogin=true&reset=success");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const LeftSection = () => (
    <div className="w-1/2 flex flex-row items-center justify-center h-full relative">
      <div className="relative w-[187px] h-[252px] bg-neutral-50 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center">
        <Image
          src="/icons/imagechart1.png"
          alt="Chart"
          width={187}
          height={252}
          className="object-contain"
        />
      </div>
      <div className="w-[187px] h-[200px] bg-white rounded-r-lg shadow-md p-6 flex flex-col justify-center">
        <h2 className="text-neutral-800 font-semibold text-xl leading-snug">
          Boost Sales <br />
          by 50%
        </h2>
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
          Drive up to 50% more sales through better call efficiency and
          territory coverage.
        </p>
      </div>
      <div className="absolute bottom-30 flex gap-2">
        <span className="w-6 h-2 bg-primary-600 rounded-full" />
        <span className="w-2 h-2 bg-neutral-50 rounded-full" />
        <span className="w-2 h-2 bg-neutral-50 rounded-full" />
        <span className="w-2 h-2 bg-neutral-50 rounded-full" />
      </div>
    </div>
  );

  // Success screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
            <LeftSection />
            <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-primary-900 mb-2">
                  Password Reset Successful!
                </h2>
                <p className="text-neutral-600 mb-4">
                  Your password has been reset successfully.
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  Redirecting to login...
                </p>
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
          <LeftSection />

          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            <form onSubmit={handleSubmit(handleResetPassword)} autoComplete="off">
              {/* Logo */}
              <div className="mb-3 flex justify-center">
                <Image
                  src="/assets/images/tiameds.logo.png"
                  alt="TiaMeds"
                  width={200}
                  height={90}
                  priority
                />
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-center text-primary-900 mb-1">
                Reset Your Password
              </h2>
              <p className="text-xs text-neutral-500 text-center mb-4">
                Use the credentials from your email to set a new password
              </p>

              {/* Username Field - Readonly with custom styling */}
              <div className="mb-3">
                <input
                  {...register("username")}
                  type="text"
                  placeholder="Username (from email)"
                  className="w-full h-12 px-4 leading-none rounded-lg border border-neutral-300 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-not-allowed"
                  disabled={isLoading}
                  readOnly
                />
                {errors.username && (
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Temporary Password Field */}
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Image
                      src="/icons/password.svg"
                      alt="Lock"
                      width={20}
                      height={20}
                      className="text-neutral-500"
                    />
                  </div>
                  <input
                    {...register("currentPassword")}
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Temporary Password (from email)"
                    autoComplete="off"
                    className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password Field */}
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Image
                      src="/icons/password.svg"
                      alt="Lock"
                      width={20}
                      height={20}
                      className="text-neutral-500"
                    />
                  </div>
                  <input
                    {...register("newPassword")}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    autoComplete="new-password"
                    className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={isLoading}
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
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-1">
                  Min 8 chars with uppercase, lowercase, number & special character
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Image
                      src="/icons/password.svg"
                      alt="Lock"
                      width={20}
                      height={20}
                      className="text-neutral-500"
                    />
                  </div>
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    autoComplete="off"
                    className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    disabled={isLoading}
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
                  <p className="text-warning-500 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-3 ${
                  isValid && !isLoading
                    ? "bg-primary-900 text-white hover:bg-primary-800"
                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>

              {/* Back to Login */}
              <Link
                href="/"
                className="text-sm text-center block w-full text-primary-700 hover:underline"
              >
                ← Back to Login
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}