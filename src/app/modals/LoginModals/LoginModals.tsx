
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";
import { TbMailFilled } from "react-icons/tb";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  loginSchema, 
  resetPasswordSchema,
  type LoginFormData, 
  type ResetPasswordFormData 
} from "@/src/schema/seller/loginSchema";
import { sellerAuthService } from "@/src/services/seller/authService";
import { User, AuthStep } from "@/src/types/seller/authData";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<AuthStep>("login");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isValid: isLoginValid },
    reset: resetLoginForm, // Add reset function for login form
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // Reset password form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isValid: isResetValid },
    reset: resetResetForm, // Add reset function for reset form
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Debug: Log step changes
  useEffect(() => {
    console.log("🔄 Current step changed to:", step);
  }, [step]);

  // Debug: Log modal open/close
  useEffect(() => {
    console.log("🔲 Modal isOpen:", isOpen);
  }, [isOpen]);

  // OTP Handlers - FIXED for copy-paste
  const isOtpValid = otp.join("").length === 6 && /^\d+$/.test(otp.join(""));

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Handle paste of multiple digits
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newOtp[index + i] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((d, i) => i > index && !d);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }
    
    // Handle single digit input
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste on the entire OTP container
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedOtp = pastedData.slice(0, 6).split('');
    
    const newOtp = [...otp];
    pastedOtp.forEach((digit, index) => {
      if (/^\d$/.test(digit)) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus the last input that was filled or next empty
    const lastFilledIndex = newOtp.findLastIndex(d => d);
    if (lastFilledIndex !== -1 && lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // API Handlers
  const onLogin = async (data: LoginFormData) => {
    console.log("📝 Login attempt started with data:", { email: data.email, password: "***" });
    setIsLoading(true);
    
    try {
      console.log("📡 Calling sellerAuthService.login...");
      const response = await sellerAuthService.login({
        username: data.email,
        password: data.password
      });

      console.log("✅ Login response received:", response);
      console.log("🔑 passwordTemporary value:", response.passwordTemporary);
      console.log("👤 User roles:", response.roles);

      // Store user info
      setCurrentUser({
        userId: response.userId,
        username: response.username,
        roles: response.roles,
        email: data.email,
        passwordTemporary: response.passwordTemporary
      });
      
      // Store the password for reset if needed
      if (response.passwordTemporary) {
        console.log("🆕 First-time login detected, storing temp password");
        setTempPassword(data.password);
      } else {
        console.log("🔄 Regular login detected");
      }
      
      setUserRole(response.roles.includes('ROLE_SELLER') ? 'seller' : 'buyer');
      setOtpEmail(data.email);
      
      // Check if password is temporary (first-time login)
      if (response.passwordTemporary) {
        console.log("🎯 First-time login flow - redirecting to reset password screen");
        toast.success("First-time login detected. Please reset your password.");
        setStep("resetPassword");
        console.log("✅ Step set to: resetPassword");
      } else {
        console.log("🎯 Regular login flow - redirecting to OTP screen");
        toast.success("Login successful! Please verify OTP.");
        console.log("📡 Sending OTP to email:", data.email);
        await sellerAuthService.sendOtpToExistingEmail({ email: data.email });
        console.log("✅ OTP sent successfully");
        setStep("otp");
        console.log("✅ Step set to: otp");
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("🏁 Login process completed");
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    console.log("🔐 OTP verification started:", { otpEmail, otp: otpString });
    
    if (!isOtpValid) {
      console.log("❌ Invalid OTP format");
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      console.log("📡 Calling verifyOtp API...");
      const response = await sellerAuthService.verifyOtp({
        email: otpEmail,
        otp: otpString
      });

      console.log("✅ OTP verification response:", response);

      if (response.status === "SUCCESS") {
        console.log("🎉 OTP verified successfully");
        toast.success("OTP verified successfully!");

        // Check if token is stored
        const token = localStorage.getItem('token');
        console.log("🔑 Token in localStorage:", token ? "Present" : "Missing");
        
        // Close the modal
        onClose();
        
        // Use router.push for navigation
        if (userRole === "seller") {
          console.log("➡️ Router pushing to seller dashboard");
          router.push("/seller_7a3b9f2c/dashboard");
        } else if (userRole === "buyer") {
          console.log("➡️ Router pushing to buyer dashboard");
          router.push("/buyer_e8d45a1b");
        }
      } else {
        console.log("❌ OTP verification failed:", response.message);
        toast.error(response.message || "Invalid OTP. Please try again.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      const errorMessage = error.response?.data?.message || 
                          "OTP verification failed. Please try again.";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpEmail) {
      console.log("❌ No OTP email found");
      return;
    }
    
    console.log("📡 Resending OTP to:", otpEmail);
    setIsLoading(true);
    try {
      await sellerAuthService.sendOtpToExistingEmail({ email: otpEmail });
      console.log("✅ OTP resent successfully");
      toast.success("OTP resent successfully!");
    } catch (error: any) {
      console.error("❌ Resend OTP error:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    console.log("🔑 Reset password started");
    
    if (!currentUser) {
      console.log("❌ No current user found");
      toast.error("User information missing. Please login again.");
      setStep("login");
      return;
    }

    console.log("Reset password data:", {
      username: currentUser.username,
      hasTempPassword: !!tempPassword
    });

    setIsLoading(true);
    try {
      console.log("📡 Calling resetPassword API...");
      await sellerAuthService.resetPassword({
        username: currentUser.username,
        currentPassword: tempPassword,
        newPassword: data.newPassword
      });

      console.log("✅ Password reset successful");
      toast.success("Password reset successful! Please login with your new password.");
      
      // Clear auth data
      sellerAuthService.clearAuth();
      
      // Reset all forms and state
      resetLoginForm(); // Clear login form
      resetResetForm(); // Clear reset form
      setStep("login");
      setOtp(Array(6).fill(""));
      setCurrentUser(null);
      setTempPassword("");
      setOtpEmail("");
      setUserRole(null);
      
      console.log("✅ Returned to login screen with cleared forms");
      
    } catch (error: any) {
      console.error("❌ Reset password error:", error);
      const errorMessage = error.response?.data?.message || 
                          "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async () => {
  if (!resetEmail) {
    console.log("❌ No reset email provided");
    toast.error("Please enter your email/username");
    return;
  }

  console.log("📡 Sending reset link to:", resetEmail);
  setIsLoading(true);
  try {
    const response = await sellerAuthService.forgotPassword({
      email: resetEmail
    });

    console.log("✅ Reset link response:", response);
    
    // Store email in localStorage for the reset page
    localStorage.setItem('resetEmail', resetEmail);
    
    setLinkSent(true);
    setSentEmail(resetEmail);
    toast.success(response.message || "Reset link sent to your email");
  } catch (error: any) {
    console.error("❌ Send reset link error:", error);
    const errorMessage = error.response?.data?.message || 
                        "Failed to send reset link. Please try again.";
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // const handleSendResetLink = async () => {
  //   if (!resetEmail) {
  //     console.log("❌ No reset email provided");
  //     toast.error("Please enter your email/username");
  //     return;
  //   }

  //   console.log("📡 Sending reset link to:", resetEmail);
  //   setIsLoading(true);
  //   try {
  //     const response = await sellerAuthService.forgotPassword({
  //       email: resetEmail
  //     });

  //     console.log("✅ Reset link response:", response);
  //     setLinkSent(true);
  //     setSentEmail(resetEmail);
  //     toast.success(response.message || "Reset link sent to your email");
  //   } catch (error: any) {
  //     console.error("❌ Send reset link error:", error);
  //     const errorMessage = error.response?.data?.message || 
  //                         "Failed to send reset link. Please try again.";
  //     toast.error(errorMessage);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log("🔄 Modal closed - resetting all states and forms");
      resetLoginForm(); // Clear login form
      resetResetForm(); // Clear reset form
      setStep("login");
      setOtp(Array(6).fill(""));
      setCurrentUser(null);
      setResetEmail("");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setLinkSent(false);
      setSentEmail("");
      setIsLoading(false);
      setOtpEmail("");
      setTempPassword("");
      setUserRole(null);
    }
  }, [isOpen, resetLoginForm, resetResetForm]);

  if (!isOpen) return null;

  // Render login step
  const renderLoginStep = () => (
    <form onSubmit={handleLoginSubmit(onLogin)}>
      <div className="mb-10 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={234}
          height={108}
          priority
        />
      </div>

      <h2 className="text-4xl text-center font-bold text-primary-900 mb-6">
        Login
      </h2>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <TbMailFilled className="w-5 h-5" />
          </div>
          <input
            {...registerLogin("email")}
            type="text"
            placeholder="Enter your email/Username"
            className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={isLoading}
          />
        </div>
        {loginErrors.email ? (
          <p className="text-warning-500 text-xs mt-1">{loginErrors.email.message}</p>
        ) : (
          <p className="text-warning-500 text-xs mt-1">Enter your registered email or username</p>
        )}
      </div>

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
            {...registerLogin("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {loginErrors.password ? (
          <p className="text-warning-500 text-xs mt-1">{loginErrors.password.message}</p>
        ) : (
          <p className="text-warning-500 text-xs mt-1">Enter your password</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isLoginValid || isLoading}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
          isLoginValid && !isLoading
            ? "bg-primary-900 text-white hover:bg-primary-800"
            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
        }`}
      >
        {isLoading ? 'Processing...' : 'Login'}
        {!isLoading && <Image src="/icons/loginIcon.svg" alt="Login" width={20} height={20} />}
      </button>

      <p className="text-sm text-neutral-900 text-center">
        Don&apos;t have an account?{" "}
        <Link 
          href="/register" 
          onClick={onClose}
          className="text-primary-700 font-medium cursor-pointer hover:underline inline-block"
        >
          Register Now
        </Link>
      </p>

      <p className="text-sm text-center mt-2">
        <button
          type="button"
          onClick={() => setStep("forgotPassword")}
          className="text-primary-900 underline cursor-pointer hover:text-primary-700"
          disabled={isLoading}
        >
          Forgot your password?
        </button>
      </p>
    </form>
  );

  // Render OTP step (with paste support)
  const renderOTPStep = () => (
    <div onPaste={handlePaste}>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={200}
          height={90}
          priority
        />
      </div>

      <h2 className="text-2xl font-semibold text-center text-black mb-2">
        Verify your email
      </h2>

      <p className="text-sm text-neutral-1000 text-center mb-1">
        We just sent a verification code to
      </p>
      <div className="text-center mb-3">
        <p className="text-xs text-neutral-500">{otpEmail}</p>
      </div>

      <p className="text-center font-semibold text-neutral-900 mb-4">
        Enter your OTP code here
      </p>

      <div className="flex justify-center gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={6} // Allow more for paste
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg font-semibold rounded-md border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-800"
            disabled={isLoading}
          />
        ))}
      </div>

      <p className="text-center text-m text-neutral-900">
        Didn&apos;t receive the OTP?
      </p>
      <button 
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
        onClick={handleResendOtp}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Resend OTP'}
      </button>

      <button
        onClick={handleVerify}
        disabled={!isOtpValid || isLoading}
        className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
          isOtpValid && !isLoading
            ? "bg-primary-900 text-white hover:bg-primary-800"
            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
        }`}
      >
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>

      <button
        onClick={() => {
          console.log("⬅️ Back to login from OTP");
          setStep("login");
          setUserRole(null);
          setOtp(Array(6).fill(""));
        }}
        className="text-sm text-center mt-3 text-primary-700 hover:underline w-full"
        disabled={isLoading}
      >
        ← Back to Login
      </button>
    </div>
  );

  // Render reset password step
  // Render reset password step
// Render reset password step
const renderResetPasswordStep = () => (
  <form onSubmit={handleResetSubmit(handleResetPassword)}>
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
    <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">
      Reset Password
    </h2>

    {/* Email Field - User will enter their email */}
    <div className="mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <TbMailFilled className="w-5 h-5" />
        </div>
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
          disabled={isLoading}
        />
      </div>
      <p className="text-xs text-neutral-400 mt-1">
        Enter the email associated with your account
      </p>
    </div>

    {/* New Password Field */}
    <div className="mb-4">
      <div className="relative">
        {/* Keep your commented code */}
        {/* <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Image
            src="/icons/password.svg"
            alt="Lock"
            width={20}
            height={20}
            className="text-neutral-500"
          />
        </div> */}
        <input
          {...registerReset("newPassword")}
          type={showNewPassword ? "text" : "password"}
          placeholder="Enter New Password"
          className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
      {resetErrors.newPassword && (
        <p className="text-warning-500 text-xs mt-1">{resetErrors.newPassword.message}</p>
      )}
      <p className="text-xs text-neutral-400 mt-1">
        Password must be at least 8 characters with uppercase, lowercase, number and special character
      </p>
    </div>

    {/* Confirm Password Field */}
    <div className="mb-6">
      <div className="relative">
        {/* Keep your commented code */}
        {/* <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Image
            src="/icons/password.svg"
            alt="Lock"
            width={20}
            height={20}
            className="text-neutral-500"
          />
        </div> */}
        <input
          {...registerReset("confirmPassword")}
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm Password"
          className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
      {resetErrors.confirmPassword && (
        <p className="text-warning-500 text-xs mt-1">{resetErrors.confirmPassword.message}</p>
      )}
    </div>

    {/* Reset Password Button */}
    <button
      type="submit"
      disabled={!isResetValid || !resetEmail || isLoading}
      className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
        isResetValid && resetEmail && !isLoading
          ? "bg-primary-900 text-white hover:bg-primary-800"
          : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
      }`}
    >
      {isLoading ? 'Changing...' : 'Change Password'}
    </button>

    {/* Register Text - Like in login section */}
    <p className="text-sm text-neutral-900 text-center">
      Don&apos;t have an account?{" "}
      <Link 
        href="/register" 
        onClick={() => {
          onClose();
          // You might want to navigate to register page
        }}
        className="text-primary-700 font-medium cursor-pointer hover:underline inline-block"
      >
        Register Now
      </Link>
    </p>

    {/* Back to Login Link - Like in login section */}
    <p className="text-sm text-center mt-2">
      <button
        type="button"
        onClick={() => {
          console.log("⬅️ Back to login from reset password");
          resetResetForm();
          setStep("login");
          setCurrentUser(null);
          setTempPassword("");
          setResetEmail(""); // Clear email field
        }}
        className="text-primary-900 underline cursor-pointer hover:text-primary-700"
        disabled={isLoading}
      >
        Back to Login
      </button>
    </p>
  </form>
);
  // const renderResetPasswordStep = () => (
  //   <form onSubmit={handleResetSubmit(handleResetPassword)}>
  //     <div className="mb-6 flex justify-center">
  //       <Image
  //         src="/assets/images/tiameds.logo.png"
  //         alt="TiaMeds"
  //         width={200}
  //         height={90}
  //         priority
  //       />
  //     </div>

  //     <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">
  //       Reset Password
  //     </h2>

  //     <div className="mb-4">
  //       <div className="relative">
  //         {/* <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
  //           <Image
  //             src="/icons/password.svg"
  //             alt="Lock"
  //             width={20}
  //             height={20}
  //             className="text-neutral-500"
  //           />
  //         </div> */}
  //         <input
  //           {...registerReset("newPassword")}
  //           type={showNewPassword ? "text" : "password"}
  //           placeholder="Enter New Password"
  //           className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
  //           disabled={isLoading}
  //         />
  //         <button
  //           type="button"
  //           onClick={() => setShowNewPassword(!showNewPassword)}
  //           className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
  //         >
  //           {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  //         </button>
  //       </div>
  //       {resetErrors.newPassword && (
  //         <p className="text-warning-500 text-xs mt-1">{resetErrors.newPassword.message}</p>
  //       )}
  //       <p className="text-xs text-neutral-400 mt-1">
  //         Password must be at least 8 characters with uppercase, lowercase, number and special character
  //       </p>
  //     </div>

  //     <div className="mb-6">
  //       <div className="relative">
  //         {/* <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
  //           <Image
  //             src="/icons/password.svg"
  //             alt="Lock"
  //             width={20}
  //             height={20}
  //             className="text-neutral-500"
  //           />
  //         </div> */}
  //         <input
  //           {...registerReset("confirmPassword")}
  //           type={showConfirmPassword ? "text" : "password"}
  //           placeholder="Confirm Password"
  //           className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
  //           disabled={isLoading}
  //         />
  //         <button
  //           type="button"
  //           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  //           className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
  //         >
  //           {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  //         </button>
  //       </div>
  //       {resetErrors.confirmPassword && (
  //         <p className="text-warning-500 text-xs mt-1">{resetErrors.confirmPassword.message}</p>
  //       )}
  //     </div>

  //     <button
  //       type="submit"
  //       disabled={!isResetValid || isLoading}
  //       className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
  //         isResetValid && !isLoading
  //           ? "bg-primary-900 text-white hover:bg-primary-800"
  //           : "bg-primary-900 text-white cursor-not-allowed"
  //       }`}
  //     >
  //       {isLoading ? 'Changing...' : 'Change Password'}
  //     </button>

  //     <button
  //       type="button"
  //       onClick={() => {
  //         console.log("⬅️ Back to login from reset password");
  //         resetResetForm(); // Clear reset form
  //         setStep("login");
  //         setCurrentUser(null);
  //         setTempPassword("");
  //       }}
  //       className="text-sm text-center w-full text-primary-700 hover:underline mt-2"
  //       disabled={isLoading}
  //     >
  //       ← Back to Login
  //     </button>
  //   </form>
  // );

  // Render forgot password step
  const renderForgotPasswordStep = () => (
    <div>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={200}
          height={90}
          priority
        />
      </div>

      {!linkSent ? (
        <>
          <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
            Forgot Password
          </h2>

          <p className="text-sm text-neutral-600 text-center mb-6">
            Enter your email. A reset link will be sent to your email address.
          </p>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <TbMailFilled className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            onClick={handleSendResetLink}
            disabled={!resetEmail || isLoading}
            className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
              resetEmail && !isLoading
                ? "bg-primary-900 text-white hover:bg-primary-800"
                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </>
      ) : (
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
            Reset Link Sent!
          </h2>
          <p className="text-sm text-neutral-600 mb-3">
            A password reset link has been sent to:
          </p>
          <p className="text-base font-semibold text-primary-700 mb-2">
            {sentEmail}
          </p>
          <p className="text-xs text-neutral-400 mt-4">
            Please check your email inbox. The link will expire in 24 hours.
          </p>
        </div>
      )}

      <button
        onClick={() => {
          console.log("⬅️ Back to login from forgot password");
          setStep("login");
          setLinkSent(false);
          setResetEmail("");
        }}
        className="text-sm text-center w-full text-primary-700 hover:underline"
        disabled={isLoading}
      >
        ← Back to Login
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl">
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-900 transition shadow-lg"
        >
          <X size={16} />
          Close
        </button>

        <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
          {/* Left Section - Static Content */}
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

          {/* Right Section - Dynamic Forms */}
          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            {step === "login" && renderLoginStep()}
            {step === "otp" && renderOTPStep()}
            {step === "resetPassword" && renderResetPasswordStep()}
            {step === "forgotPassword" && renderForgotPasswordStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;




























// original code without backend integration..................

// "use client";

// import { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { X, Eye, EyeOff } from "lucide-react";
// import { TbMailFilled } from "react-icons/tb";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import toast from "react-hot-toast";
// import { loginSchema, otpSchema, resetPasswordSchema, type LoginFormData, type OTPFormData, type ResetPasswordFormData } from "@/src/schema/seller/loginSchema";
// import Link from "next/link";

// interface LoginModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }


// const mockUsers = [
//   {
//     email: "seller@gmail.com",
//     username: "seller_123",
//     password: "Seller@123",
//     role: "seller" as const,
//     isFirstTimeLogin: true,
//     coordinatorEmail: "seller@gmail.com", 
//     coordinatorPhone: "9876543210", 
//   },
//   {
//     email: "buyer@gmail.com",
//     username: "buyer_123",
//     password: "Buyer@123",
//     role: "buyer" as const,
//     isFirstTimeLogin: false,
//     coordinatorEmail: "",
//     coordinatorPhone: "",
//   },
// ];

// type AuthStep = "login" | "otp" | "resetPassword" | "forgotPassword";

// const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [step, setStep] = useState<AuthStep>("login");
//   const [otp, setOtp] = useState(Array(6).fill(""));
//   const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [resetEmail, setResetEmail] = useState("");
//   const [linkSent, setLinkSent] = useState(false);
//   const [sentEmail, setSentEmail] = useState("");
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

//   // Login form
//   const {
//     register: registerLogin,
//     handleSubmit: handleLoginSubmit,
//     formState: { errors: loginErrors, isValid: isLoginValid },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     mode: "onChange",
//   });

//   // Reset password form
//   const {
//     register: registerReset,
//     handleSubmit: handleResetSubmit,
//     formState: { errors: resetErrors, isValid: isResetValid },
//   } = useForm<ResetPasswordFormData>({
//     resolver: zodResolver(resetPasswordSchema),
//     mode: "onChange",
//   });

//   const onLogin = (data: LoginFormData) => {
//     // Find user by email or username
//     const user = mockUsers.find(
//       (u) =>
//         (u.email === data.email || u.username === data.email) &&
//         u.password === data.password
//     );

//     if (user) {
//       setCurrentUser(user);
//       setUserRole(user.role);
      
//       // Check if first-time login for seller
//       if (user.role === "seller" && user.isFirstTimeLogin) {
//         toast.success("First-time login detected. Please reset your password.");
//         setStep("resetPassword");
//       } else {
//         toast.success("Login successful! Please verify OTP.");
//         setStep("otp");
//       }
//     } else {
//       toast.error("Invalid email/username or password.");
//     }
//   };

//   const handleResetPassword = (data: ResetPasswordFormData) => {
//     // Simulate password reset
//     if (data.newPassword === data.confirmPassword) {
//       toast.success("Password reset successful! Please login with new password.");
      
//       // Update mock user (in real app, this would be an API call)
//       if (currentUser) {
//         // eslint-disable-next-line react-hooks/immutability
//         currentUser.isFirstTimeLogin = false;
//         currentUser.password = data.newPassword;
//       }
      
//       setStep("login");
//     }
//   };

//   const handleSendResetLink = () => {
//     if (!resetEmail) {
//       toast.error("Please enter your email/username");
//       return;
//     }

//     const user = mockUsers.find(
//       (u) => u.email === resetEmail || u.username === resetEmail
//     );

//     if (user && user.role === "seller") {
//       setSentEmail(user.coordinatorEmail);
//       setLinkSent(true);
//     } else {
//       toast.error("Seller account not found with this email/username");
//     }
//   };

//   const handleVerify = () => {
//     const otpString = otp.join("");
//     try {
//       otpSchema.parse({ otp: otpString });
//       if (otpString === "123456") {
//         toast.success("OTP verified successfully!");

//         // Redirect based on role
//         if (userRole === "seller") {
//           router.push("/seller_7a3b9f2c/dashboard");
//         } else if (userRole === "buyer") {
//           router.push("/buyer_e8d45a1b");
//         } else {
//           toast.error("Something went wrong. Please login again.");
//           setStep("login");
//         }

//         onClose();
//       } else {
//         toast.error("Invalid OTP. Please try again.");
//       }
//     } catch (error: any) {
//       toast.error(error.errors?.[0]?.message || "Invalid OTP");
//     }
//   };

//   const isOtpValid = otp.join("").length === 6 && /^\d+$/.test(otp.join(""));

//   const handleOtpChange = (value: string, index: number) => {
//     if (!/^\d?$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (
//     e: React.KeyboardEvent<HTMLInputElement>,
//     index: number
//   ) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   // Reset state when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       setStep("login");
//       setOtp(Array(6).fill(""));
//       setCurrentUser(null);
//       setResetEmail("");
//       setShowPassword(false);
//       setShowNewPassword(false);
//       setShowConfirmPassword(false);
//       setLinkSent(false);
//       setSentEmail("");
//     }
//   }, [isOpen]);

//   if (!isOpen) return null;

//   // Render login step (original design preserved)
//   const renderLoginStep = () => (
//     <form onSubmit={handleLoginSubmit(onLogin)}>
//       {/* Logo */}
//       <div className="mb-10 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={234}
//           height={108}
//           priority
//         />
//       </div>

//       {/* Login Title */}
//       <h2 className="text-4xl text-center font-bold text-primary-900 mb-6">
//         Login
//       </h2>

//       {/* Email Field */}
//       <div className="mb-4">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <TbMailFilled className="w-5 h-5" />
//           </div>
//           <input
//             {...registerLogin("email")}
//             type="text"
//             placeholder="Enter your email/Username"
//             className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//           />
//         </div>
//         {loginErrors.email ? (
//           <p className="text-warning-500 text-xs mt-1">{loginErrors.email.message}</p>
//         ) : (
//           <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
//         )}
//       </div>

//       {/* Password Field */}
//       <div className="mb-6">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <Image
//               src="/icons/password.svg"
//               alt="Lock"
//               width={20}
//               height={20}
//               className="text-neutral-500"
//             />
//           </div>
//           <input
//             {...registerLogin("password")}
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
//           >
//             {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </div>
//         {loginErrors.password ? (
//           <p className="text-warning-500 text-xs mt-1">{loginErrors.password.message}</p>
//         ) : (
//           <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
//         )}
//       </div>

//       {/* Login Button */}
//       <button
//         type="submit"
//         disabled={!isLoginValid}
//         className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
//           isLoginValid
//             ? "bg-primary-900 text-white hover:bg-primary-800"
//             : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//         }`}
//       >
//         Login
//         <Image
//           src="/icons/loginIcon.svg"
//           alt="Login"
//           width={20}
//           height={20}
//         />
//       </button>

//       {/* Register Text */}
//       <p className="text-sm text-neutral-900 text-center">
//         Don&apos;t have an account?{" "}
//         <Link 
//           href="/register" 
//           onClick={onClose}
//           className="text-primary-700 font-medium cursor-pointer hover:underline inline-block"
//         >
//           Register Now
//         </Link>
//       </p>

//       {/* Forgot Password */}
//       <p className="text-sm text-center mt-2">
//         <button
//           type="button"
//           onClick={() => setStep("forgotPassword")}
//           className="text-primary-900 underline cursor-pointer hover:text-primary-700"
//         >
//           Forgot your password?
//         </button>
//       </p>
//     </form>
//   );

//   // Render reset password step
//   const renderResetPasswordStep = () => (
//     <form onSubmit={handleResetSubmit(handleResetPassword)}>
//       {/* Logo */}
//       <div className="mb-6 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={200}
//           height={90}
//           priority
//         />
//       </div>

//       {/* Title */}
//       <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
//         Reset Your Password
//       </h2>

//       {/* Description */}
//       <p className="text-sm text-neutral-600 text-center mb-6">
//         First-time login detected. Please set a new password.
//       </p>

//       {/* New Password Field */}
//       <div className="mb-4">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <Image
//               src="/icons/password.svg"
//               alt="Lock"
//               width={20}
//               height={20}
//               className="text-neutral-500"
//             />
//           </div>
//           <input
//             {...registerReset("newPassword")}
//             type={showNewPassword ? "text" : "password"}
//             placeholder="New Password"
//             className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//           />
//           <button
//             type="button"
//             onClick={() => setShowNewPassword(!showNewPassword)}
//             className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
//           >
//             {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </div>
//         {resetErrors.newPassword && (
//           <p className="text-warning-500 text-xs mt-1">{resetErrors.newPassword.message}</p>
//         )}
//       </div>

//       {/* Confirm Password Field */}
//       <div className="mb-6">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <Image
//               src="/icons/password.svg"
//               alt="Lock"
//               width={20}
//               height={20}
//               className="text-neutral-500"
//             />
//           </div>
//           <input
//             {...registerReset("confirmPassword")}
//             type={showConfirmPassword ? "text" : "password"}
//             placeholder="Confirm Password"
//             className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//           />
//           <button
//             type="button"
//             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//             className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
//           >
//             {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </div>
//         {resetErrors.confirmPassword && (
//           <p className="text-warning-500 text-xs mt-1">{resetErrors.confirmPassword.message}</p>
//         )}
//       </div>

//       {/* Reset Button */}
//       <button
//         type="submit"
//         disabled={!isResetValid}
//         className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
//           isResetValid
//             ? "bg-primary-900 text-white hover:bg-primary-800"
//             : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//         }`}
//       >
//         Reset Password
//       </button>

//       {/* Back to Login */}
//       <button
//         type="button"
//         onClick={() => setStep("login")}
//         className="text-sm text-center w-full text-primary-700 hover:underline mt-2"
//       >
//         ← Back to Login
//       </button>
//     </form>
//   );

//   // Render forgot password step
//   const renderForgotPasswordStep = () => {
//     return (
//       <div>
//         {/* Logo */}
//         <div className="mb-6 flex justify-center">
//           <Image
//             src="/assets/images/tiameds.logo.png"
//             alt="TiaMeds"
//             width={200}
//             height={90}
//             priority
//           />
//         </div>
  
//         {!linkSent ? (
//           <>
//             {/* Title */}
//             <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
//               Forgot Password
//             </h2>
  
//             {/* Description */}
//             <p className="text-sm text-neutral-600 text-center mb-6">
//               Enter your email/username. A reset link will be sent to your{" "}
//               <span className="font-semibold">coordinator&apos;s registered email</span>
//             </p>
  
//             {/* Email Field */}
//             <div className="mb-6">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                   <TbMailFilled className="w-5 h-5" />
//                 </div>
//                 <input
//                   type="text"
//                   value={resetEmail}
//                   onChange={(e) => setResetEmail(e.target.value)}
//                   placeholder="Enter your email/Username"
//                   className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//                 />
//               </div>
//             </div>
  
//             {/* Send Reset Link Button */}
//             <button
//               onClick={handleSendResetLink}
//               disabled={!resetEmail}
//               className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
//                 resetEmail
//                   ? "bg-primary-900 text-white hover:bg-primary-800"
//                   : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//               }`}
//             >
//               Send Reset Link
//             </button>
//           </>
//         ) : (
//           <>
//             {/* Success Message */}
//             <div className="text-center mb-6">
//               <div className="w-16 h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//                 </svg>
//               </div>
//               <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
//                 Reset Link Sent!
//               </h2>
//               <p className="text-sm text-neutral-600 mb-3">
//                 A password reset link has been sent to your registered Email-Id at:
//               </p>
//               <p className="text-base font-semibold text-primary-700 mb-2">
//                 {sentEmail}
//               </p>
//               <p className="text-xs text-neutral-400 mt-4">
//                 Please check with your registered Email-Id.
//               </p>
//             </div>
//           </>
//         )}
  
//         {/* Back to Login */}
//         <button
//           onClick={() => {
//             setStep("login");
//             setLinkSent(false);
//             setResetEmail("");
//           }}
//           className="text-sm text-center w-full text-primary-700 hover:underline"
//         >
//           ← Back to Login
//         </button>
//       </div>
//     );
//   };

//   // Render OTP step
//   const renderOTPStep = () => (
//     <>
//       {/* Logo */}
//       <div className="mb-6 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={200}
//           height={90}
//           priority
//         />
//       </div>

//       {/* Title */}
//       <h2 className="text-2xl font-semibold text-center text-black mb-2">
//         Verify your mobile number
//       </h2>

//       {/* Description with coordinator info */}
//       <p className="text-sm text-neutral-1000 text-center mb-1">
//         We just sent a verification code to your coordinator
//       </p>
//       {currentUser && (
//         <div className="text-center mb-3">
//           <p className="text-xs text-neutral-500">{currentUser.coordinatorEmail}</p>
//           <p className="text-xs text-neutral-500">{currentUser.coordinatorPhone}</p>
//           <p className="text-xs text-success-600 mt-1">Use OTP: 123456</p>
//         </div>
//       )}

//       {/* OTP Label */}
//       <p className="text-center font-semibold text-neutral-900 mb-4">
//         Enter your OTP code here
//       </p>

//       {/* OTP Inputs */}
//       <div className="flex justify-center gap-3 mb-6">
//         {otp.map((digit, index) => (
//           <input
//             key={index}
//             ref={(el) => {
//               inputRefs.current[index] = el;
//             }}
//             type="text"
//             maxLength={1}
//             value={digit}
//             onChange={(e) => handleOtpChange(e.target.value, index)}
//             onKeyDown={(e) => handleKeyDown(e, index)}
//             className="w-12 h-12 text-center text-lg font-semibold rounded-md border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-800"
//           />
//         ))}
//       </div>

//       {/* Resend OTP */}
//       <p className="text-center text-m text-neutral-900">
//         Didn&apos;t receive the OTP?
//       </p>
//       <button 
//         className="text-warning-500 font-medium text-center w-full hover:underline mt-1"
//         onClick={() => toast.success("OTP 123456 resent to coordinator")}
//       >
//         Resend OTP
//       </button>

//       {/* Verify Button */}
//       <button
//         onClick={handleVerify}
//         disabled={!isOtpValid}
//         className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
//           isOtpValid
//             ? "bg-primary-900 text-white hover:bg-primary-800"
//             : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//         }`}
//       >
//         Verify
//       </button>

//       {/* Back to Login */}
//       <button
//         onClick={() => {
//           setStep("login");
//           setUserRole(null);
//         }}
//         className="text-sm text-center mt-3 text-primary-700 hover:underline"
//       >
//         ← Back to Login
//       </button>
//     </>
//   );

//   return (
//     <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
//       {/* BACKDROP */}
//       <div
//         className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
//         onClick={onClose}
//       />

//       {/* MODAL CONTAINER */}
//       <div className="relative w-full max-w-5xl">
//         {/* Close Button - Positioned Outside */}
//         <button
//           onClick={onClose}
//           className="absolute -top-14 right-0 bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-900 transition shadow-lg"
//         >
//           <X size={16} />
//           Close
//         </button>

//         {/* Modal Content */}
//         <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
//           {/* LEFT SECTION - unchanged */}
//           <div className="w-1/2 flex flex-row items-center justify-center h-full relative">
//             {/* Chart Card */}
//             <div className="relative w-[187px] h-[252px] bg-neutral-50 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center">
//               <Image
//                 src="/icons/imagechart1.png"
//                 alt="Chart"
//                 width={187}
//                 height={252}
//                 className="object-contain"
//               />
//             </div>

//             {/* Text Card */}
//             <div className="w-[187px] h-[200px] bg-white rounded-r-lg shadow-md p-6 flex flex-col justify-center">
//               <h2 className="text-neutral-800 font-semibold text-xl leading-snug">
//                 Boost Sales <br />
//                 by 50%
//               </h2>
//               <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
//                 Drive up to 50% more sales through better call efficiency
//                 and territory coverage.
//               </p>
//             </div>

//             {/* Dots */}
//             <div className="absolute bottom-30 flex gap-2">
//               <span className="w-6 h-2 bg-primary-600 rounded-full" />
//               <span className="w-2 h-2 bg-neutral-50 rounded-full" />
//               <span className="w-2 h-2 bg-neutral-50 rounded-full" />
//               <span className="w-2 h-2 bg-neutral-50 rounded-full" />
//             </div>
//           </div>

//           {/* RIGHT SECTION */}
//           <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
//             {step === "login" && renderLoginStep()}
//             {step === "resetPassword" && renderResetPasswordStep()}
//             {step === "forgotPassword" && renderForgotPasswordStep()}
//             {step === "otp" && renderOTPStep()}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginModal;