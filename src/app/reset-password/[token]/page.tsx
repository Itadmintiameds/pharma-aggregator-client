"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  resetPasswordSchema,
  type ResetPasswordFormData 
} from "@/src/schema/seller/loginSchema";
import { sellerAuthService } from "@/src/services/seller/authService";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Reset password form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Validate token on page load
  useEffect(() => {
    validateToken();
    // Get email from localStorage if available
    const storedEmail = localStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [token]);

  const validateToken = async () => {
    setIsLoading(true);
    try {
      const response = await sellerAuthService.validateResetToken(token);
      if (response.valid) {
        setIsValidToken(true);
        setIsVerified(true);
      } else {
        setIsValidToken(false);
        toast.error("Invalid or expired reset link");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setIsValidToken(false);
      toast.error("Invalid or expired reset link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await sellerAuthService.resetPasswordWithToken({
        token: token,
        newPassword: data.newPassword
      });

      setResetSuccess(true);
      toast.success("Password reset successful!");
      
      // Clear the stored email
      localStorage.removeItem('resetEmail');
      
      // Redirect to home with login modal after 2 seconds
      setTimeout(() => {
        router.push("/?showLogin=true&reset=success");
      }, 2000);
      
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage = error.response?.data?.message || 
                          "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If token is invalid, show error screen
  if (!isValidToken && !isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
            {/* LEFT SECTION - Same as login modal */}
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
                  Drive up to 50% more sales through better call efficiency
                  and territory coverage.
                </p>
              </div>

              <div className="absolute bottom-30 flex gap-2">
                <span className="w-6 h-2 bg-primary-600 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              </div>
            </div>

            {/* RIGHT SECTION - Error message */}
            <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-primary-900 mb-2">
                  Invalid Reset Link
                </h2>
                <p className="text-neutral-600 mb-6">
                  This password reset link is invalid or has expired.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If reset successful, show success screen
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
            {/* LEFT SECTION - Same as login modal */}
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
                  Drive up to 50% more sales through better call efficiency
                  and territory coverage.
                </p>
              </div>

              <div className="absolute bottom-30 flex gap-2">
                <span className="w-6 h-2 bg-primary-600 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
                <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              </div>
            </div>

            {/* RIGHT SECTION - Success message */}
            <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
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
          {/* LEFT SECTION - Exactly same as login modal */}
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
                Drive up to 50% more sales through better call efficiency
                and territory coverage.
              </p>
            </div>

            <div className="absolute bottom-30 flex gap-2">
              <span className="w-6 h-2 bg-primary-600 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
            </div>
          </div>

          {/* RIGHT SECTION - Reset password form */}
          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            <form onSubmit={handleSubmit(handleResetPassword)}>
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <Image
                  src="/assets/images/tiameds.logo.png"
                  alt="TiaMeds"
                  width={200}
                  height={90}
                  priority
                />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
                Reset Your Password
              </h2>

              {/* Description with email if available */}
              <p className="text-sm text-neutral-600 text-center mb-6">
                {email ? `For account: ${email}` : 'Please set a new password for your account.'}
              </p>

              {/* New Password Field */}
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
                    {...register("newPassword")}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
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
                  <p className="text-warning-500 text-xs mt-1">{errors.newPassword.message}</p>
                )}
                <p className="text-xs text-neutral-400 mt-1">
                  Password must be at least 8 characters with uppercase, lowercase, number and special character
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-6">
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
                    placeholder="Confirm Password"
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
                  <p className="text-warning-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Reset Button */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
                  isValid && !isLoading
                    ? "bg-primary-900 text-white hover:bg-primary-800"
                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              {/* Back to Login Link */}
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