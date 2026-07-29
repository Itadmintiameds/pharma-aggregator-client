"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";
import { TbMailFilled } from "react-icons/tb";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Link from "next/link";
import { 
  loginSchema,
  resetPasswordSchema,
  type LoginFormData, 
  type ResetPasswordFormData 
} from "@/src/schema/seller/loginSchema";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { User, AuthStep } from "@/src/types/seller/authData";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional override: when provided, a successful login calls this instead
  // of redirecting to the role dashboard (e.g. so the registration wizard
  // can stay on the current page and just unlock once the user is logged in).
  onLoginSuccess?: () => void;
}

// Carousel slides data
const carouselSlides = [
  {
    id: 1,
    image: "/icons/imagechart1.png",
    title: "Boost Sales by 50%",
    description: "Drive up to 50% more sales through better call efficiency and territory coverage.1",
    imageBgColor: "bg-neutral-50",
    textBgColor: "bg-neutral-50",
    dotColor: "bg-purple-600"
  },
  {
    id: 2,
    image: "/icons/login2.png",
    title: "Data-Driven Management",
    description: "Gain instant insights from live dashboards and make faster, smarter field decisions.",
    imageBgColor: "bg-gradient-to-b from-secondary-200 to-secondary-900",
    textBgColor: "bg-secondary-100",
    dotColor: "bg-purple-600"
  },
  {
    id: 3,
    image: "/icons/login3.png",
    title: "Cut Costs by 30%+",
    description: "Go digital eliminate paper, manual entry, and printing to slash admin overheads.",
    imageBgColor: "bg-yellow-400",
    textBgColor: "bg-yellow-50",
    dotColor: "bg-purple-600"
  },
  {
    id: 4,
    image: "/icons/login4.png",
    title: "Instant Approvals & Insights",
    description: "Approve tours and expenses in minutes, not weeks, with automated workflows.",
    imageBgColor: "bg-warning-200",
    textBgColor: "bg-warning-50",
    dotColor: "bg-purple-600"
  },
  {
    id: 5,
    image: "/icons/login5.png",
    title: "100% Compliance & Visibility",
    description: "Maintain GPS-verified, audit-ready records and track your entire supply chain in real time.",
    imageBgColor: "bg-neutral-400",
    textBgColor: "bg-neutral-50",
    dotColor: "bg-purple-600"
  },
  {
    id: 6,
    image: "/icons/login6.png",
    title: "Empower Reps on the Field",
    description: "Work offline or online, file DCRs in minutes, and get paid faster with automated claims.",
    imageBgColor: "bg-primary-10",
    textBgColor: "bg-secondary-100",
    dotColor: "bg-purple-600"
  }
];

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [tempCredentials, setTempCredentials] = useState<{ username: string; password: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  // ========== NEW STATE FOR FORGOT PASSWORD OTP FLOW ==========
  const [forgotPasswordToken, setForgotPasswordToken] = useState<string>("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState(Array(6).fill(""));
  const forgotPasswordInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isValid: isLoginValid },
    reset: resetLoginForm,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // Reset password form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isValid: isResetValid },
    reset: resetResetForm,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && isOpen) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      }, 2000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isOpen]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // OTP Handlers for Login OTP
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

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
    
    const lastFilledIndex = newOtp.findLastIndex(d => d);
    if (lastFilledIndex !== -1 && lastFilledIndex < 5) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // ========== NEW OTP HANDLERS FOR FORGOT PASSWORD ==========
  const isForgotPasswordOtpValid = forgotPasswordOtp.join("").length === 6 && /^\d+$/.test(forgotPasswordOtp.join(""));

  const handleForgotPasswordOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Handle paste of multiple digits
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...forgotPasswordOtp];
      
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newOtp[index + i] = digit;
        }
      });
      
      setForgotPasswordOtp(newOtp);
      
      const nextEmptyIndex = newOtp.findIndex((d, i) => i > index && !d);
      if (nextEmptyIndex !== -1) {
        forgotPasswordInputRefs.current[nextEmptyIndex]?.focus();
      } else {
        forgotPasswordInputRefs.current[5]?.focus();
      }
      return;
    }
    
    // Handle single digit input
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...forgotPasswordOtp];
    newOtp[index] = value;
    setForgotPasswordOtp(newOtp);

    if (value && index < 5) {
      forgotPasswordInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotPasswordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !forgotPasswordOtp[index] && index > 0) {
      forgotPasswordInputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowLeft" && index > 0) {
      forgotPasswordInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      forgotPasswordInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotPasswordPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedOtp = pastedData.slice(0, 6).split('');
    
    const newOtp = [...forgotPasswordOtp];
    pastedOtp.forEach((digit, index) => {
      if (/^\d$/.test(digit)) {
        newOtp[index] = digit;
      }
    });
    
    setForgotPasswordOtp(newOtp);
    
    const lastFilledIndex = newOtp.findLastIndex(d => d);
    if (lastFilledIndex !== -1 && lastFilledIndex < 5) {
      forgotPasswordInputRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      forgotPasswordInputRefs.current[5]?.focus();
    }
  };

  // Clear credentials helper
  const clearCredentials = () => {
    console.log("🔒 Clearing stored credentials");
    setTempCredentials(null);
  };

  // Function to wait for page to fully load
  const waitForPageLoad = (targetPath: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log("⏳ Waiting for page to load:", targetPath);
      
      // Check if we're already on the target page
      if (window.location.pathname === targetPath) {
        console.log("✅ Already on target page, waiting for content...");
        setTimeout(() => {
          resolve();
        }, 500);
        return;
      }

      // Use MutationObserver to detect when the page content is actually rendered
      const observer = new MutationObserver((mutations, obs) => {
        // Look for main content indicators
        const mainContent = document.querySelector('main, [data-testid="dashboard"], .dashboard-container, #__next > div:not(:empty)');
        
        if (mainContent && mainContent.children.length > 0) {
          console.log("✅ Page content detected, resolving...");
          obs.disconnect();
          setTimeout(() => {
            resolve();
          }, 300);
        }
      });

      // Start observing the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also listen for URL changes
      const checkUrlInterval = setInterval(() => {
        if (window.location.pathname === targetPath) {
          console.log("✅ URL matched target path");
          clearInterval(checkUrlInterval);
          setTimeout(() => {
            observer.disconnect();
            resolve();
          }, 500);
        }
      }, 100);

      // Safety timeout to prevent infinite waiting (10 seconds max)
      setTimeout(() => {
        console.log("⚠️ Page load timeout, proceeding anyway");
        observer.disconnect();
        clearInterval(checkUrlInterval);
        resolve();
      }, 10000);
    });
  };

  // API Handlers
  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await sellerAuthService.login({
        username: data.email,
        password: data.password
      });
      
      setTempCredentials({
        username: data.email,
        password: data.password
      });
      
      setOtpEmail(response.username);
      
      toast.success(response.message || "OTP sent to your email!");
      setStep("otp");
      
    } catch (error: any) {
      console.error("=========================================");
      console.error("❌ LOGIN ERROR");
      console.error("=========================================");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      
      if (error.response?.status === 403) {
        console.error("🔒 Account locked detected");
        toast.error("Account is locked. Please contact support.");
      }
      console.error("=========================================");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    
    if (!isOtpValid) {
      console.error("❌ Invalid OTP format");
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await sellerAuthService.verifyOtp({
        username: otpEmail,
        email: otpEmail,
        otp: otpString
      });

      // Determine user role
      const role = response.roles?.includes('ROLE_SELLER') ? 'seller' : 'buyer';
      setUserRole(role);
      
      // Check if this is first-time login (passwordTemporary = true)
      if (response.passwordTemporary) {
        toast.success("First-time login detected. Please reset your password.");
        setCurrentUser({
          userId: response.userId,
          username: response.username,
          roles: response.roles,
          email: otpEmail,
          passwordTemporary: response.passwordTemporary
        });
        setStep("resetPassword");
        setIsLoading(false);
        return;
      }
      
      // Regular login flow (passwordTemporary = false)
      // Verify tokens were stored
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedAccessToken || !storedRefreshToken) {
        console.error("❌ CRITICAL: Tokens not found in localStorage after verifyOtp!");
        toast.error("Authentication error. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Clear stored credentials after successful verification
      clearCredentials();

      toast.success("Login successful!");
      window.dispatchEvent(new Event('auth-changed'));

      if (onLoginSuccess) {
        onLoginSuccess();
        onClose();
        setIsLoading(false);
        return;
      }

      setIsNavigating(true);

      // Navigate based on role
      let dashboardPath = "";
      if (role === "seller") {
        // A seller login doesn't necessarily mean registration was completed —
        // they may have only just signed up, or have a TempSeller still
        // pending approval. Only send them to the dashboard if an approved
        // Seller profile actually exists; otherwise send them back into the
        // registration wizard to finish/continue it.
        try {
          await sellerProfileService.getCurrentSellerProfile();
          dashboardPath = "/seller_7a3b9f2c/dashboard";
        } catch {
          dashboardPath = "/seller_7a3b9f2c";
        }
        router.push(dashboardPath);
      } else if (role === "buyer") {
        dashboardPath = "/buyer_e8d45a1b";
        router.push(dashboardPath);
      }
      
      if (dashboardPath) {
        await waitForPageLoad(dashboardPath);
      }
      
      onClose();
      setIsNavigating(false);
      setIsLoading(false);
      
    } catch (error: any) {
      console.error("=========================================");
      console.error("❌ OTP VERIFICATION ERROR");
      console.error("=========================================");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      if (error.message?.includes("expired") || error.response?.status === 410) {
        toast.error("OTP has expired. Please login again to receive a new OTP.");
        clearCredentials();
        setStep("login");
        setOtp(Array(6).fill(""));
      } else if (error.message?.includes("Too many") || error.response?.status === 429) {
        toast.error("Too many failed attempts. Please try again later.");
        clearCredentials();
        setStep("login");
      } else if (error.response?.status === 403) {
        toast.error("Your account is locked or inactive. Please contact support.");
        clearCredentials();
        setStep("login");
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.message ||
                            "OTP verification failed. Please try again.";
        toast.error(errorMessage);
      }
      console.error("=========================================");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!tempCredentials) {
      console.error("❌ No stored credentials found");
      toast.error("Session expired. Please login again.");
      setStep("login");
      setOtp(Array(6).fill(""));
      return;
    }
    
    setIsLoading(true);
    
    try {
      setOtp(Array(6).fill(""));
      
      const response = await sellerAuthService.login({
        username: tempCredentials.username,
        password: tempCredentials.password
      });
      
      toast.success("New OTP sent to your email!");
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      
    } catch (error: any) {
      console.error("❌ RESEND OTP ERROR");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to resend OTP. Please try login again.";
      toast.error(errorMessage);
      
      clearCredentials();
      setStep("login");
      setOtp(Array(6).fill(""));
    } finally {
      setIsLoading(false);
    }
  };

  // ========== NEW FORGOT PASSWORD HANDLERS ==========
  
  const handleSendResetLink = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sellerAuthService.forgotPasswordSendOtp({
        email: resetEmail
      });

      if (response.status === "SUCCESS") {
        toast.success("OTP sent to your email!");
        setStep("forgotPasswordOtp");
        setForgotPasswordOtp(Array(6).fill(""));
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("❌ Send OTP error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message ||
                          "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async () => {
    const otpString = forgotPasswordOtp.join("");
    
    if (!isForgotPasswordOtpValid) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    
    try {
      const resetToken = await sellerAuthService.verifyForgotPasswordOtp({
        email: resetEmail,
        otp: otpString
      });
      
      setForgotPasswordToken(resetToken);
      toast.success("OTP verified! Please set your new password.");
      setStep("resetPassword");
      
    } catch (error: any) {
      console.error("❌ OTP verification error:", error);
      
      if (error.message?.includes("expired")) {
        toast.error("OTP has expired. Please request a new OTP.");
        setStep("forgotPassword");
        setResetEmail("");
      } else {
        toast.error(error.message || "OTP verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    try {
      // Check if this is forgot password flow (has reset token)
      if (forgotPasswordToken) {
        await sellerAuthService.resetForgottenPassword(
          forgotPasswordToken,
          data.newPassword
        );
        
        toast.success("Password reset successful! Please login with your new password.");
        
        // Clear all forgot password data
        setForgotPasswordToken("");
        setForgotPasswordOtp(Array(6).fill(""));
        setResetEmail("");
        
      } else if (currentUser && tempCredentials?.password) {
        // First-time login flow - use current password
        await sellerAuthService.resetPassword({
          username: currentUser.username,
          currentPassword: tempCredentials.password,
          newPassword: data.newPassword
        });
        
        toast.success("Password reset successful! Please login with your new password.");
        
      } else {
        console.error("❌ Invalid reset password state");
        toast.error("Unable to reset password. Please try again.");
        setStep("login");
        return;
      }
      
      // Clear auth data
      sellerAuthService.clearAuth();
      clearCredentials();
      
      // Reset all forms and state
      resetLoginForm();
      resetResetForm();
      setStep("login");
      setOtp(Array(6).fill(""));
      setCurrentUser(null);
      setOtpEmail("");
      setUserRole(null);
      
    } catch (error: any) {
      console.error("❌ RESET PASSWORD ERROR");
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error response data:", error.response?.data);
      
      const errorMessage = error.response?.data?.data?.currentPassword || 
                          error.response?.data?.message || 
                          "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetLoginForm();
      resetResetForm();
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
      setIsNavigating(false);
      setOtpEmail("");
      setUserRole(null);
      setCurrentSlide(0);
      setIsAutoPlaying(true);
      clearCredentials();
      // Reset forgot password state
      setForgotPasswordToken("");
      setForgotPasswordOtp(Array(6).fill(""));
      if (typeof window !== 'undefined') {
        localStorage.removeItem('otpUsername');
      }
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
          width={233}
          height={108}
          priority
        />
      </div>

      <h2 className="text-h5 text-center font-medium text-pneutral-900 mb-6 font-heading">
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
            autoComplete="off"
            className="w-full h-12 pl-12 pr-4 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 outline-none focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
          />
        </div>
        {loginErrors.email && (
          <p className="text-warning-500 text-xs mt-1">
            {loginErrors.email.message}
          </p>
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
            autoComplete="off"
            className="w-full h-12 pl-12 pr-12 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {loginErrors.password && (
          <p className="text-warning-500 text-xs mt-1">
            {loginErrors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isLoginValid || isLoading || isNavigating}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
          isLoginValid && !isLoading && !isNavigating
            ? "bg-primary-800 text-pneutral-50"
            : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
        }`}
      >
        {isLoading || isNavigating ? 'Processing...' : 'Login'}
        {!isLoading && !isNavigating && <Image src="/icons/loginIcon.svg" alt="Login" width={20} height={20} />}
      </button>

      <p className="text-sm text-pneutral-900 text-center">
        Don&apos;t have an account?{" "}
        <Link 
          href="/register" 
          onClick={onClose}
          className="text-pneutral-900 font-medium cursor-pointer hover:underline inline-block"
        >
          Register Now
        </Link>
      </p>

      <p className="text-sm text-center mt-2">
        <button
          type="button"
          onClick={() => setStep("forgotPassword")}
          className="text-pneutral-900 underline cursor-pointer"
          disabled={isLoading || isNavigating}
        >
          Forgot your password?
        </button>
      </p>
    </form>
  );

  // Render OTP step (for login)
  const renderOTPStep = () => (
    <div onPaste={handlePaste}>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={233}
          height={108}
          priority
        />
      </div>

      <h2 className="text-2xl font-semibold text-center text-pneutral-900 mb-2">
        Verify your email
      </h2>

      <p className="text-sm text-pneutral-900 text-center mb-1">
        We just sent a verification code to
      </p>
      <div className="text-center mb-3">
        <p className="text-xs text-pneutral-500">{otpEmail}</p>
      </div>

      <p className="text-center font-semibold text-pneutral-900 mb-4">
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
            maxLength={6} 
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
          />
        ))}
      </div>

      <p className="text-center text-m text-pneutral-900">
        Didn&apos;t receive the OTP?
      </p>
      <button 
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
        onClick={handleResendOtp}
        disabled={isLoading || isNavigating}
      >
        {isLoading ? 'Sending...' : 'Resend OTP'}
      </button>

      <button
        onClick={handleVerify}
        disabled={!isOtpValid || isLoading || isNavigating}
        className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
          isOtpValid && !isLoading && !isNavigating
            ? "bg-primary-800 text-pneutral-50"
            : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
        }`}
      >
        {isLoading || isNavigating ? 'Verifying...' : 'Verify'}
      </button>

      <button
        onClick={() => {
          setStep("login");
          setUserRole(null);
          setOtp(Array(6).fill(""));
        }}
        className="text-sm text-center mt-3 text-primary-700 hover:underline w-full"
        disabled={isLoading || isNavigating}
      >
        ← Back to Login
      </button>
    </div>
  );

  // Render reset password step (used for both first-time login and forgot password)
  const renderResetPasswordStep = () => (
    <form onSubmit={handleResetSubmit(handleResetPassword)}>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={233}
          height={108}
          priority
        />
      </div>

      <h2 className="text-2xl font-bold text-center text-pneutral-900 mb-2">
        {forgotPasswordToken ? "Set New Password" : "Reset Password"}
      </h2>

      <p className="text-sm text-neutral-600 text-center mb-6">
        Please set a new password for your account.
      </p>

      {/* New Password Field */}
      <div className="mb-4">
        <div className="relative">
          <input
            {...registerReset("newPassword")}
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter New Password"
            autoComplete="off"
            className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
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
          <input
            {...registerReset("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            autoComplete="off"
            className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
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

      <button
        type="submit"
        disabled={!isResetValid || isLoading || isNavigating}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
          isResetValid && !isLoading && !isNavigating
            ? "bg-primary-800 text-pneutral-50"
            : "bg-pneutral-300 text-pneutral-500 cursor-not-allowed"
        }`}
      >
        {isLoading || isNavigating ? 'Changing...' : 'Change Password'}
      </button>

      <p className="text-sm text-pneutral-900 text-center">
        Don&apos;t have an account?{" "}
        <Link 
          href="/register" 
          onClick={() => {
            onClose();
          }}
          className="text-pneutral-900 font-medium cursor-pointer hover:underline inline-block"
        >
          Register Now
        </Link>
      </p>

      <p className="text-sm text-center mt-2">
        <button
          type="button"
          onClick={() => {
            resetResetForm();
            setStep("login");
            setCurrentUser(null);
            setResetEmail("");
            setForgotPasswordToken("");
            setForgotPasswordOtp(Array(6).fill(""));
            clearCredentials();
          }}
          className="text-primary-900 underline cursor-pointer hover:text-primary-700"
          disabled={isLoading || isNavigating}
        >
          Back to Login
        </button>
      </p>
    </form>
  );

  // Render forgot password step (email input)
  const renderForgotPasswordStep = () => (
    <div>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={233}
          height={108}
          priority
        />
      </div>

      <h2 className="text-h5 font-medium text-center text-pneutral-900 mb-2 font-heading">
        Forgot Password
      </h2>

      <p className="text-sm text-pneutral-600 text-center mb-6">
        Enter your email. An OTP will be send to your email address.
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
            autoComplete="off"
            className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
          />
        </div>
      </div>

      <button
        onClick={handleSendResetLink}
        disabled={!resetEmail || isLoading || isNavigating}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
          resetEmail && !isLoading && !isNavigating
            ? "bg-primary-800 text-pneutral-50"
            : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
        }`}
      >
        {isLoading || isNavigating ? 'Sending...' : 'Verify'}
      </button>

      <button
        onClick={() => {
          setStep("login");
          setResetEmail("");
        }}
        className="text-sm text-center w-full text-primary-700 hover:underline"
        disabled={isLoading || isNavigating}
      >
        ← Back to Login
      </button>
    </div>
  );

  // ========== NEW RENDER FOR FORGOT PASSWORD OTP STEP ==========
  const renderForgotPasswordOtpStep = () => (
    <div onPaste={handleForgotPasswordPaste}>
      <div className="mb-6 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={233}
          height={108}
          priority
        />
      </div>

      <h2 className="text-2xl font-semibold text-center text-pneutral-900 mb-2">
        Verify Your Email
      </h2>

      <p className="text-sm text-pneutral-900 text-center mb-1">
        We just sent a verification code to
      </p>
      <div className="text-center mb-3">
        <p className="text-xs text-pneutral-700">{resetEmail}</p>
      </div>

      <p className="text-center font-semibold text-pneutral-900 mb-4">
        Enter your OTP here
      </p>

      <div className="flex justify-center gap-3 mb-6">
        {forgotPasswordOtp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              forgotPasswordInputRefs.current[index] = el;
            }}
            type="text"
            maxLength={6}
            value={digit}
            onChange={(e) => handleForgotPasswordOtpChange(e, index)}
            onKeyDown={(e) => handleForgotPasswordKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={isLoading || isNavigating}
          />
        ))}
      </div>

      <p className="text-center text-m text-pneutral-900">
        Didn&apos;t receive the OTP?
      </p>
      <button 
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
        onClick={handleSendResetLink}
        disabled={isLoading || isNavigating}
      >
        {isLoading ? 'Sending...' : 'Resend OTP'}
      </button>

      <button
        onClick={handleVerifyForgotPasswordOtp}
        disabled={!isForgotPasswordOtpValid || isLoading || isNavigating}
        className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
          isForgotPasswordOtpValid && !isLoading && !isNavigating
            ? "bg-primary-800 text-pneutral-50"
            : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
        }`}
      >
        {isLoading || isNavigating ? 'Verifying...' : 'Verify OTP'}
      </button>

      <button
        onClick={() => {
          setStep("forgotPassword");
          setResetEmail("");
          setForgotPasswordOtp(Array(6).fill(""));
        }}
        className="text-sm text-center mt-3 text-primary-700 hover:underline w-full"
        disabled={isLoading || isNavigating}
      >
        ← Back to Forgot Password
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
          className="absolute -top-14 right-0 bg-secondary-700 text-pneutral-50 px-4 py-2 rounded-md flex items-center gap-2 transition shadow-lg"
        >
          <X size={16} />
          Close
        </button>

        <div className="bg-primary-100 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
          {/* Left Section - Carousel */}
          <div 
            className="w-1/2 flex flex-col items-center justify-center h-full relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full flex items-center justify-center">
              <div className="flex items-center justify-center transition-all duration-500">
                <div className={`relative w-[187px] h-[252px] ${carouselSlides[currentSlide].imageBgColor} backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center overflow-hidden transition-colors duration-500`}>
                  <Image
                    src={carouselSlides[currentSlide].image}
                    alt={`Slide ${currentSlide + 1}`}
                    width={187}
                    height={252}
                    className="object-contain transition-all duration-500"
                  />
                </div>

                <div className={`w-[187px] h-[200px] ${carouselSlides[currentSlide].textBgColor} rounded-r-lg shadow-md p-6 flex flex-col justify-center transition-colors duration-500`}>
                  <h2 className="text-neutral-800 font-bold text-xl leading-snug">
                    {carouselSlides[currentSlide].title}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                    {carouselSlides[currentSlide].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 flex gap-2">
              {carouselSlides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-200 ${
                    index === currentSlide
                      ? `w-6 h-2 ${slide.dotColor} rounded-full`
                      : "w-2 h-2 bg-neutral-300 rounded-full hover:bg-primary-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Section - Dynamic Forms */}
          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            {step === "login" && renderLoginStep()}
            {step === "otp" && renderOTPStep()}
            {step === "resetPassword" && renderResetPasswordStep()}
            {step === "forgotPassword" && renderForgotPasswordStep()}
            {step === "forgotPasswordOtp" && renderForgotPasswordOtpStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;















// code dated 05.06.2026 20:12 pm ......................

// "use client";

// import { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { X, Eye, EyeOff } from "lucide-react";
// import { TbMailFilled } from "react-icons/tb";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import toast from "react-hot-toast";
// import Link from "next/link";
// import { 
//   loginSchema,
//   resetPasswordSchema,
//   type LoginFormData, 
//   type ResetPasswordFormData 
// } from "@/src/schema/seller/loginSchema";
// import { sellerAuthService } from "@/src/services/seller/authService";
// import { User, AuthStep } from "@/src/types/seller/authData";

// interface LoginModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// // Carousel slides data
// const carouselSlides = [
//   {
//     id: 1,
//     image: "/icons/imagechart1.png",
//     title: "Boost Sales by 50%",
//     description: "Drive up to 50% more sales through better call efficiency and territory coverage.1",
//     imageBgColor: "bg-neutral-50",
//     textBgColor: "bg-neutral-50",
//     dotColor: "bg-purple-600"
//   },
//   {
//     id: 2,
//     image: "/icons/login2.png",
//     title: "Data-Driven Management",
//     description: "Gain instant insights from live dashboards and make faster, smarter field decisions.",
//     imageBgColor: "bg-gradient-to-b from-secondary-200 to-secondary-900",
//     textBgColor: "bg-secondary-100",
//     dotColor: "bg-purple-600"
//   },
//   {
//     id: 3,
//     image: "/icons/login3.png",
//     title: "Cut Costs by 30%+",
//     description: "Go digital eliminate paper, manual entry, and printing to slash admin overheads.",
//     imageBgColor: "bg-yellow-400",
//     textBgColor: "bg-yellow-50",
//     dotColor: "bg-purple-600"
//   },
//   {
//     id: 4,
//     image: "/icons/login4.png",
//     title: "Instant Approvals & Insights",
//     description: "Approve tours and expenses in minutes, not weeks, with automated workflows.",
//     imageBgColor: "bg-warning-200",
//     textBgColor: "bg-warning-50",
//     dotColor: "bg-purple-600"
//   },
//   {
//     id: 5,
//     image: "/icons/login5.png",
//     title: "100% Compliance & Visibility",
//     description: "Maintain GPS-verified, audit-ready records and track your entire supply chain in real time.",
//     imageBgColor: "bg-neutral-400",
//     textBgColor: "bg-neutral-50",
//     dotColor: "bg-purple-600"
//   },
//   {
//     id: 6,
//     image: "/icons/login6.png",
//     title: "Empower Reps on the Field",
//     description: "Work offline or online, file DCRs in minutes, and get paid faster with automated claims.",
//     imageBgColor: "bg-primary-10",
//     textBgColor: "bg-secondary-100",
//     dotColor: "bg-purple-600"
//   }
// ];

// const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [step, setStep] = useState<AuthStep>("login");
//   const [otp, setOtp] = useState(Array(6).fill(""));
//   const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [resetEmail, setResetEmail] = useState("");
//   const [linkSent, setLinkSent] = useState(false);
//   const [sentEmail, setSentEmail] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [otpEmail, setOtpEmail] = useState("");
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [isAutoPlaying, setIsAutoPlaying] = useState(true);
//   const [tempCredentials, setTempCredentials] = useState<{ username: string; password: string } | null>(null);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

//   // Login form
//   const {
//     register: registerLogin,
//     handleSubmit: handleLoginSubmit,
//     formState: { errors: loginErrors, isValid: isLoginValid },
//     reset: resetLoginForm,
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     mode: "onChange",
//   });

//   // Reset password form
//   const {
//     register: registerReset,
//     handleSubmit: handleResetSubmit,
//     formState: { errors: resetErrors, isValid: isResetValid },
//     reset: resetResetForm,
//   } = useForm<ResetPasswordFormData>({
//     resolver: zodResolver(resetPasswordSchema),
//     mode: "onChange",
//   });

//   // Auto-play functionality
//   useEffect(() => {
//     if (isAutoPlaying && isOpen) {
//       autoPlayRef.current = setInterval(() => {
//         setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
//       }, 2000);
//     }

//     return () => {
//       if (autoPlayRef.current) {
//         clearInterval(autoPlayRef.current);
//       }
//     };
//   }, [isAutoPlaying, isOpen]);

//   const handleMouseEnter = () => setIsAutoPlaying(false);
//   const handleMouseLeave = () => setIsAutoPlaying(true);

//   const goToSlide = (index: number) => {
//     setCurrentSlide(index);
//   };

//   // OTP Handlers
//   const isOtpValid = otp.join("").length === 6 && /^\d+$/.test(otp.join(""));

//   const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
//     const value = e.target.value;
    
//     // Handle paste of multiple digits
//     if (value.length > 1) {
//       const pastedOtp = value.slice(0, 6).split('');
//       const newOtp = [...otp];
      
//       pastedOtp.forEach((digit, i) => {
//         if (index + i < 6 && /^\d$/.test(digit)) {
//           newOtp[index + i] = digit;
//         }
//       });
      
//       setOtp(newOtp);
      
//       const nextEmptyIndex = newOtp.findIndex((d, i) => i > index && !d);
//       if (nextEmptyIndex !== -1) {
//         inputRefs.current[nextEmptyIndex]?.focus();
//       } else {
//         inputRefs.current[5]?.focus();
//       }
//       return;
//     }
    
//     // Handle single digit input
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
    
//     if (e.key === "ArrowLeft" && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//     if (e.key === "ArrowRight" && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();
//     const pastedData = e.clipboardData.getData('text');
//     const pastedOtp = pastedData.slice(0, 6).split('');
    
//     const newOtp = [...otp];
//     pastedOtp.forEach((digit, index) => {
//       if (/^\d$/.test(digit)) {
//         newOtp[index] = digit;
//       }
//     });
    
//     setOtp(newOtp);
    
//     const lastFilledIndex = newOtp.findLastIndex(d => d);
//     if (lastFilledIndex !== -1 && lastFilledIndex < 5) {
//       inputRefs.current[lastFilledIndex + 1]?.focus();
//     } else {
//       inputRefs.current[5]?.focus();
//     }
//   };

//   // Clear credentials helper
//   const clearCredentials = () => {
//     console.log("🔒 Clearing stored credentials");
//     setTempCredentials(null);
//   };

//   // Function to wait for page to fully load
// // Function to wait for page to fully load
// const waitForPageLoad = (targetPath: string): Promise<void> => {
//   return new Promise((resolve) => {
//     console.log("⏳ Waiting for page to load:", targetPath);
    
//     // Check if we're already on the target page
//     if (window.location.pathname === targetPath) {
//       console.log("✅ Already on target page, waiting for content...");
//       setTimeout(() => {
//         resolve();
//       }, 500);
//       return;
//     }

//     // Use MutationObserver to detect when the page content is actually rendered
//     const observer = new MutationObserver((mutations, obs) => {
//       // Look for main content indicators
//       const mainContent = document.querySelector('main, [data-testid="dashboard"], .dashboard-container, #__next > div:not(:empty)');
      
//       if (mainContent && mainContent.children.length > 0) {
//         console.log("✅ Page content detected, resolving...");
//         obs.disconnect();
//         setTimeout(() => {
//           resolve();
//         }, 300);
//       }
//     });

//     // Start observing the document body for changes
//     observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });

//     // Also listen for URL changes
//     const checkUrlInterval = setInterval(() => {
//       if (window.location.pathname === targetPath) {
//         console.log("✅ URL matched target path");
//         clearInterval(checkUrlInterval);
//         setTimeout(() => {
//           observer.disconnect();
//           resolve();
//         }, 500);
//       }
//     }, 100);

//     // Safety timeout to prevent infinite waiting (10 seconds max)
//     setTimeout(() => {
//       console.log("⚠️ Page load timeout, proceeding anyway");
//       observer.disconnect();
//       clearInterval(checkUrlInterval);
//       resolve();
//     }, 10000);
//   });
// };

//   // API Handlers
//   const onLogin = async (data: LoginFormData) => {
//     // console.log("=========================================");
//     // console.log("📝 LOGIN ATTEMPT STARTED");
//     // console.log("=========================================");
//     // console.log("📧 Email/Username:", data.email);
//     // console.log("🔑 Password: ***MASKED***");
//     // console.log("⏰ Timestamp:", new Date().toISOString());
    
//     setIsLoading(true);
    
//     try {
//       // console.log("📡 Calling sellerAuthService.login with payload:", 
//       //   {
//       //   username: data.email,
//       //   password: "***MASKED***"
//       // });
      
//       const response = await sellerAuthService.login({
//         username: data.email,
//         password: data.password
//       });

//       // console.log("✅ LOGIN API RESPONSE RECEIVED");
//       // console.log("📦 Response data:", {
//       //   username: response.username,
//       //   message: response.message,
//       //   status: "SUCCESS"
//       // });
      
//       // Store credentials for potential OTP resend
//       // console.log("💾 Storing credentials temporarily for OTP resend");
//       setTempCredentials({
//         username: data.email,
//         password: data.password
//       });
      
//       setOtpEmail(response.username);
//       // console.log("📧 OTP will be sent to:", response.username);
      
//       toast.success(response.message || "OTP sent to your email!");
//       setStep("otp");
      
//       // console.log("🔄 Step changed to: OTP");
//       // console.log("=========================================");
      
//     } catch (error: any) {
//       console.error("=========================================");
//       console.error("❌ LOGIN ERROR");
//       console.error("=========================================");
//       console.error("Error message:", error.message);
//       console.error("Error status:", error.response?.status);
//       console.error("Error response data:", error.response?.data);
//       console.error("Error stack:", error.stack);
      
//       const errorMessage = error.response?.data?.message || 
//                           error.response?.data?.error || 
//                           error.message ||
//                           "Login failed. Please check your credentials.";
//       toast.error(errorMessage);
      
//       // Handle account locked
//       if (error.response?.status === 403) {
//         console.error("🔒 Account locked detected");
//         toast.error("Account is locked. Please contact support.");
//       }
//       console.error("=========================================");
//     } finally {
//       setIsLoading(false);
//       // console.log("🏁 Login process completed at:", new Date().toISOString());
//     }
//   };

// const handleVerify = async () => {
//   const otpString = otp.join("");
  
//   console.log("=========================================");
//   console.log("🔐 OTP VERIFICATION STARTED");
//   console.log("=========================================");
  
//   if (!isOtpValid) {
//     console.error("❌ Invalid OTP format");
//     toast.error("Please enter a valid 6-digit OTP");
//     return;
//   }

//   setIsLoading(true);
  
//   try {
//     console.log("📡 Calling sellerAuthService.verifyOtp...");
    
//     const response = await sellerAuthService.verifyOtp({
//       username: otpEmail,
//       email: otpEmail,
//       otp: otpString
//     });
    
//     console.log("✅ OTP VERIFICATION API RESPONSE RECEIVED");
//     console.log("📦 Response data:", {
//       hasAccessToken: !!response.accessToken,
//       hasRefreshToken: !!response.refreshToken,
//       userId: response.userId,
//       username: response.username,
//       roles: response.roles,
//       passwordTemporary: response.passwordTemporary,
//     });

//     // Determine user role
//     const role = response.roles?.includes('ROLE_SELLER') ? 'seller' : 'buyer';
//     setUserRole(role);
//     console.log("👤 User role determined:", role);
    
//     // ✅ Check if this is first-time login (passwordTemporary = true)
//     if (response.passwordTemporary) {
//       console.log("🆕 First-time login detected - No tokens needed");
//       console.log("🔄 Redirecting to reset password flow");
      
//       toast.success("First-time login detected. Please reset your password.");
//       setCurrentUser({
//         userId: response.userId,
//         username: response.username,
//         roles: response.roles,
//         email: otpEmail,
//         passwordTemporary: response.passwordTemporary
//       });
//       setStep("resetPassword");
//       console.log("🔄 Step changed to: resetPassword");
//       setIsLoading(false);
//       return; // ✅ Exit early - don't check for tokens
//     }
    
//     // ✅ Regular login flow (passwordTemporary = false)
//     console.log("🎉 Regular login - Checking for tokens");
    
//     // Verify tokens were stored
//     const storedAccessToken = localStorage.getItem('accessToken');
//     const storedRefreshToken = localStorage.getItem('refreshToken');
    
//     if (!storedAccessToken || !storedRefreshToken) {
//       console.error("❌ CRITICAL: Tokens not found in localStorage after verifyOtp!");
//       console.error(`AccessToken: ${storedAccessToken ? 'YES' : 'NO'}`);
//       console.error(`RefreshToken: ${storedRefreshToken ? 'YES' : 'NO'}`);
//       toast.error("Authentication error. Please try again.");
//       setIsLoading(false);
//       return;
//     }
    
//     console.log("🔑 AccessToken in localStorage: ✅ PRESENT");
//     console.log("🔑 RefreshToken in localStorage: ✅ PRESENT");
    
//     // Clear stored credentials after successful verification
//     clearCredentials();
//     console.log("🔒 Stored credentials cleared after successful verification");
    
//     toast.success("Login successful!");
//     setIsNavigating(true);
    
//     // Navigate based on role
//     let dashboardPath = "";
//     if (role === "seller") {
//       dashboardPath = "/seller_7a3b9f2c/dashboard";
//       console.log("➡️ Navigating to seller dashboard at:", dashboardPath);
//       router.push(dashboardPath);
//     } else if (role === "buyer") {
//       dashboardPath = "/buyer_e8d45a1b";
//       console.log("➡️ Navigating to buyer dashboard at:", dashboardPath);
//       router.push(dashboardPath);
//     }
    
//     // Wait for the dashboard page to fully load
//     if (dashboardPath) {
//       await waitForPageLoad(dashboardPath);
//       console.log("✅ Dashboard fully loaded, closing modal");
//     }
    
//     // Close the modal after page is fully loaded
//     onClose();
//     console.log("🚪 Modal closed");
    
//     // Reset states
//     setIsNavigating(false);
//     setIsLoading(false);
    
//     console.log("=========================================");
    
//   } catch (error: any) {
//     console.error("=========================================");
//     console.error("❌ OTP VERIFICATION ERROR");
//     console.error("=========================================");
//     console.error("Error message:", error.message);
//     console.error("Error status:", error.response?.status);
//     console.error("Error response data:", error.response?.data);
    
//     // Handle specific error cases
//     if (error.message?.includes("expired") || error.response?.status === 410) {
//       console.error("⏰ OTP has expired (410 status code)");
//       toast.error("OTP has expired. Please login again to receive a new OTP.");
//       clearCredentials();
//       setStep("login");
//       setOtp(Array(6).fill(""));
//     } else if (error.message?.includes("Too many") || error.response?.status === 429) {
//       console.error("🚫 Too many failed attempts (429 status code)");
//       toast.error("Too many failed attempts. Please try again later.");
//       clearCredentials();
//       setStep("login");
//     } else if (error.response?.status === 403) {
//       console.error("🔒 Account locked or inactive (403 status code)");
//       toast.error("Your account is locked or inactive. Please contact support.");
//       clearCredentials();
//       setStep("login");
//     } else {
//       const errorMessage = error.response?.data?.message || 
//                           error.response?.data?.error || 
//                           error.message ||
//                           "OTP verification failed. Please try again.";
//       toast.error(errorMessage);
//       console.error("❌ Error message displayed to user:", errorMessage);
//     }
//     console.error("=========================================");
//     setIsLoading(false);
//   }
// };

//   const handleResendOtp = async () => {
//     // console.log("=========================================");
//     // console.log("📡 RESEND OTP REQUESTED");
//     // console.log("=========================================");
    
//     if (!tempCredentials) {
//       console.error("❌ No stored credentials found");
//       toast.error("Session expired. Please login again.");
//       setStep("login");
//       setOtp(Array(6).fill(""));
//       return;
//     }
    
//     // console.log("📧 Resending OTP for user:", tempCredentials.username);
//     // console.log("🔑 Using stored credentials (password: ***MASKED***)");
//     setIsLoading(true);
    
//     try {
//       // Clear existing OTP inputs for new OTP
//       setOtp(Array(6).fill(""));
//       // console.log("🔄 Cleared existing OTP inputs");
      
//       // Call login again with stored credentials
//       // console.log("📡 Calling sellerAuthService.login to resend OTP...");
//       const response = await sellerAuthService.login({
//         username: tempCredentials.username,
//         password: tempCredentials.password
//       });
      
//       // console.log("✅ OTP RESENT SUCCESSFULLY");
//       // console.log("📦 Response:", {
//       //   username: response.username,
//       //   message: response.message
//       // });
      
//       toast.success("New OTP sent to your email!");
      
//       // Focus on first OTP input for convenience
//       setTimeout(() => {
//         inputRefs.current[0]?.focus();
//         // console.log("🎯 Focused on first OTP input");
//       }, 100);
      
//     } catch (error: any) {
//       console.error("❌ RESEND OTP ERROR");
//       console.error("Error message:", error.message);
//       console.error("Error status:", error.response?.status);
//       console.error("Error response data:", error.response?.data);
      
//       const errorMessage = error.response?.data?.message || 
//                           error.response?.data?.error || 
//                           "Failed to resend OTP. Please try login again.";
//       toast.error(errorMessage);
      
//       // Clear credentials and go back to login on failure
//       clearCredentials();
//       setStep("login");
//       setOtp(Array(6).fill(""));
//       // console.log("🔄 Step changed to: login (due to resend failure)");
//     } finally {
//       setIsLoading(false);
//       // console.log("=========================================");
//     }
//   };

//   const handleResetPassword = async (data: ResetPasswordFormData) => {
//     // console.log("=========================================");
//     // console.log("🔑 RESET PASSWORD STARTED");
//     // console.log("=========================================");
//     // console.log("👤 Current user:", currentUser?.username);
//     // console.log("🆕 New password length:", data.newPassword.length);
    
//     if (!currentUser) {
//       console.error("❌ No current user found");
//       toast.error("User information missing. Please login again.");
//       setStep("login");
//       return;
//     }

//     setIsLoading(true);
//     try {

//        // Get the current password from tempCredentials (the password user entered during login)
//     const currentPassword = tempCredentials?.password || "";
    
//     if (!currentPassword) {
//       console.error("❌ Current password not found in tempCredentials");
//       toast.error("Session expired. Please login again.");
//       setStep("login");
//       return;
//     }

//     console.log("📡 Calling resetPassword API with current password");
//       // console.log("📡 Calling resetPassword API...");
//       await sellerAuthService.resetPassword({
//         username: currentUser.username,
//         currentPassword: currentPassword,
//         // currentPassword: tempCredentials?.password || "",
//         newPassword: data.newPassword
//       });

//       // console.log("✅ PASSWORD RESET SUCCESSFUL");
//       toast.success("Password reset successful! Please login with your new password.");
      
//       // Clear auth data
//       sellerAuthService.clearAuth();
//       // console.log("🔒 Auth data cleared from storage");
      
//       // Clear any stored credentials
//       clearCredentials();
      
//       // Reset all forms and state
//       resetLoginForm();
//       resetResetForm();
//       setStep("login");
//       setOtp(Array(6).fill(""));
//       setCurrentUser(null);
//       setOtpEmail("");
//       setUserRole(null);
      
//       // console.log("🔄 All forms and state reset");
//       // console.log("🔄 Step changed to: login");
      
//     } catch (error: any) {
//       console.error("❌ RESET PASSWORD ERROR");
//       console.error("Error message:", error.message);
//       console.error("Error status:", error.response?.status);
//       console.error("Error response data:", error.response?.data);
      
//       const errorMessage = error.response?.data?.data?.currentPassword || 
//                         error.response?.data?.message || 
//                         "Failed to reset password. Please try again.";
//       toast.error(errorMessage);
//     } finally {
//       setIsLoading(false);
//       // console.log("=========================================");
//     }
//   };

//   const handleSendResetLink = async () => {
//     if (!resetEmail) {
//       // console.log("❌ No reset email provided");
//       toast.error("Please enter your email/username");
//       return;
//     }

//     // console.log("📡 Sending reset link to:", resetEmail);
//     setIsLoading(true);
//     try {
//       const response = await sellerAuthService.forgotPassword({
//         email: resetEmail
//       });

//       // console.log("✅ Reset link response:", {
//       //   status: response.status,
//       //   message: response.message
//       // });
      
//       localStorage.setItem('resetEmail', resetEmail);
      
//       setLinkSent(true);
//       setSentEmail(resetEmail);
//       toast.success(response.message || "Reset link sent to your email");
//     } catch (error: any) {
//       console.error("❌ Send reset link error:", {
//         message: error.message,
//         status: error.response?.status
//       });
//       const errorMessage = error.response?.data?.message || 
//                           "Failed to send reset link. Please try again.";
//       toast.error(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Debug effect to monitor localStorage changes
//   // useEffect(() => {
//   //   if (typeof window !== 'undefined') {
//   //     console.log("🔍 Debug - Current localStorage token:", localStorage.getItem('token') ? "Present" : "Missing");
//   //     console.log("🔍 Debug - Current step:", step);
//   //     console.log("🔍 Debug - Current user role:", userRole);
//   //   }
//   // }, [step, userRole]);

//   // Reset state when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       // console.log("=========================================");
//       // console.log("🔄 MODAL CLOSED - RESETTING ALL STATES");
//       // console.log("=========================================");
//       resetLoginForm();
//       resetResetForm();
//       setStep("login");
//       setOtp(Array(6).fill(""));
//       setCurrentUser(null);
//       setResetEmail("");
//       setShowPassword(false);
//       setShowNewPassword(false);
//       setShowConfirmPassword(false);
//       setLinkSent(false);
//       setSentEmail("");
//       setIsLoading(false);
//       setIsNavigating(false);
//       setOtpEmail("");
//       setUserRole(null);
//       setCurrentSlide(0);
//       setIsAutoPlaying(true);
//       clearCredentials();
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('otpUsername');
//         // console.log("🗑️ Removed otpUsername from localStorage");
//       }
//       // console.log("✅ All states reset successfully");
//       // console.log("=========================================");
//     }
//   }, [isOpen, resetLoginForm, resetResetForm]);

//   if (!isOpen) return null;

//   // Render login step
//   const renderLoginStep = () => (
//     <form onSubmit={handleLoginSubmit(onLogin)}>
//       <div className="mb-10 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={233}
//           height={108}
//           priority
//         />
//       </div>

//       <h2 className="text-h5 text-center font-medium text-pneutral-900 mb-6 font-heading">
//         Login
//       </h2>

//       <div className="mb-4">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <TbMailFilled className="w-5 h-5" />
//           </div>
//           <input
//             {...registerLogin("email")}
//             type="text"
//             placeholder="Enter your email/Username"
//             autoComplete="off"
//             className="w-full h-12 pl-12 pr-4 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 outline-none focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//             disabled={isLoading || isNavigating}
//           />
//         </div>
//         {loginErrors.email && (
//           <p className="text-warning-500 text-xs mt-1">
//             {loginErrors.email.message}
//           </p>
//         )}
//       </div>

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
//             autoComplete="off"
//             className="w-full h-12 pl-12 pr-12 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//             disabled={isLoading || isNavigating}
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
//           >
//             {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </div>
//         {loginErrors.password && (
//           <p className="text-warning-500 text-xs mt-1">
//             {loginErrors.password.message}
//           </p>
//         )}
//       </div>

//       <button
//         type="submit"
//         disabled={!isLoginValid || isLoading || isNavigating}
//         className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
//           isLoginValid && !isLoading && !isNavigating
//             ? "bg-primary-800 text-pneutral-50"
//             : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
//         }`}
//       >
//         {isLoading || isNavigating ? 'Processing...' : 'Login'}
//         {!isLoading && !isNavigating && <Image src="/icons/loginIcon.svg" alt="Login" width={20} height={20} />}
//       </button>

//       <p className="text-sm text-pneutral-900 text-center">
//         Don&apos;t have an account?{" "}
//         <Link 
//           href="/register" 
//           onClick={onClose}
//           className="text-pneutral-900 font-medium cursor-pointer hover:underline inline-block"
//         >
//           Register Now
//         </Link>
//       </p>

//       <p className="text-sm text-center mt-2">
//         <button
//           type="button"
//           onClick={() => setStep("forgotPassword")}
//           className="text-pneutral-900 underline cursor-pointer"
//           disabled={isLoading || isNavigating}
//         >
//           Forgot your password?
//         </button>
//       </p>
//     </form>
//   );

//   // Render OTP step
//   const renderOTPStep = () => (
//     <div onPaste={handlePaste}>
//       <div className="mb-6 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={233}
//           height={108}
//           priority
//         />
//       </div>

//       <h2 className="text-2xl font-semibold text-center text-pneutral-900 mb-2">
//         Verify your email
//       </h2>

//       <p className="text-sm text-pneutral-900 text-center mb-1">
//         We just sent a verification code to
//       </p>
//       <div className="text-center mb-3">
//         <p className="text-xs text-pneutral-500">{otpEmail}</p>
//       </div>

//       <p className="text-center font-semibold text-pneutral-900 mb-4">
//         Enter your OTP code here
//       </p>

//       <div className="flex justify-center gap-3 mb-6">
//         {otp.map((digit, index) => (
//           <input
//             key={index}
//             ref={(el) => {
//               inputRefs.current[index] = el;
//             }}
//             type="text"
//             maxLength={6} 
//             value={digit}
//             onChange={(e) => handleOtpChange(e, index)}
//             onKeyDown={(e) => handleKeyDown(e, index)}
//             className="w-12 h-12 text-center text-lg font-semibold rounded-xl border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//             disabled={isLoading || isNavigating}
//           />
//         ))}
//       </div>

//       <p className="text-center text-m text-pneutral-900">
//         Didn&apos;t receive the OTP?
//       </p>
//       <button 
//         className="text-warning-500 font-medium text-center w-full hover:underline mt-1 disabled:opacity-50"
//         onClick={handleResendOtp}
//         disabled={isLoading || isNavigating}
//       >
//         {isLoading ? 'Sending...' : 'Resend OTP'}
//       </button>

//       <button
//         onClick={handleVerify}
//         disabled={!isOtpValid || isLoading || isNavigating}
//         className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
//           isOtpValid && !isLoading && !isNavigating
//             ? "bg-primary-800 text-pneutral-50"
//             : "bg-primary-800 text-pneutral-50 cursor-not-allowed"
//         }`}
//       >
//         {isLoading || isNavigating ? 'Verifying...' : 'Verify'}
//       </button>

//       <button
//         onClick={() => {
//           // console.log("⬅️ Back to login from OTP");
//           setStep("login");
//           setUserRole(null);
//           setOtp(Array(6).fill(""));
//           // clearCredentials();
//         }}
//         className="text-sm text-center mt-3 text-primary-700 hover:underline w-full"
//         disabled={isLoading || isNavigating}
//       >
//         ← Back to Login
//       </button>
//     </div>
//   );

//   // Render reset password step
//   const renderResetPasswordStep = () => (
//     <form onSubmit={handleResetSubmit(handleResetPassword)}>
//       <div className="mb-6 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={233}
//           height={108}
//           priority
//         />
//       </div>

//       <h2 className="text-2xl font-bold text-center text-pneutral-900 mb-2">
//         Reset Password
//       </h2>

//       <p className="text-sm text-neutral-600 text-center mb-6">
//         Please set a new password for your account.
//       </p>

//       {/* New Password Field */}
//       <div className="mb-4">
//         <div className="relative">
//           <input
//             {...registerReset("newPassword")}
//             type={showNewPassword ? "text" : "password"}
//             placeholder="Enter New Password"
//             autoComplete="off"
//             className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//             disabled={isLoading || isNavigating}
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
//         <p className="text-xs text-neutral-400 mt-1">
//           Password must be at least 8 characters with uppercase, lowercase, number and special character
//         </p>
//       </div>

//       {/* Confirm Password Field */}
//       <div className="mb-6">
//         <div className="relative">
//           <input
//             {...registerReset("confirmPassword")}
//             type={showConfirmPassword ? "text" : "password"}
//             placeholder="Confirm Password"
//             autoComplete="off"
//             className="w-full h-12 pl-2 pr-12 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//             disabled={isLoading || isNavigating}
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

//       <button
//         type="submit"
//         disabled={!isResetValid || isLoading || isNavigating}
//         className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
//           isResetValid && !isLoading && !isNavigating
//             ? "bg-primary-800 text-pneutral-50"
//             : "bg-pneutral-300 text-pneutral-500 cursor-not-allowed"
//         }`}
//       >
//         {isLoading || isNavigating ? 'Changing...' : 'Change Password'}
//       </button>

//       <p className="text-sm text-pneutral-900 text-center">
//         Don&apos;t have an account?{" "}
//         <Link 
//           href="/register" 
//           onClick={() => {
//             onClose();
//           }}
//           className="text-pneutral-900 font-medium cursor-pointer hover:underline inline-block"
//         >
//           Register Now
//         </Link>
//       </p>

//       <p className="text-sm text-center mt-2">
//         <button
//           type="button"
//           onClick={() => {
//             // console.log("⬅️ Back to login from reset password");
//             resetResetForm();
//             setStep("login");
//             setCurrentUser(null);
//             setResetEmail("");
//             clearCredentials();
//           }}
//           className="text-primary-900 underline cursor-pointer hover:text-primary-700"
//           disabled={isLoading || isNavigating}
//         >
//           Back to Login
//         </button>
//       </p>
//     </form>
//   );

//   // Render forgot password step
//   const renderForgotPasswordStep = () => (
//     <div>
//       <div className="mb-6 flex justify-center">
//         <Image
//           src="/assets/images/tiameds.logo.png"
//           alt="TiaMeds"
//           width={233}
//           height={108}
//           priority
//         />
//       </div>

//       {!linkSent ? (
//         <>
//           <h2 className="text-h5 font-medium text-center text-pneutral-900 mb-2 font-heading">
//             Forgot Password
//           </h2>

//           <p className="text-sm text-pneutral-600 text-center mb-6">
//             Enter your email. A reset link will be sent to your email address.
//           </p>

//           <div className="mb-6">
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                 <TbMailFilled className="w-5 h-5" />
//               </div>
//               <input
//                 type="text"
//                 value={resetEmail}
//                 onChange={(e) => setResetEmail(e.target.value)}
//                 placeholder="Enter your email"
//                  autoComplete="off"
//                 className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-pneutral-300 bg-pneutral-50 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
//                 disabled={isLoading || isNavigating}
//               />
//             </div>
//           </div>

//           <button
//             onClick={handleSendResetLink}
//             disabled={!resetEmail || isLoading || isNavigating}
//             className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
//               resetEmail && !isLoading && !isNavigating
//                 ? "bg-primary-800 text-pneutral-50 "
//                 : "bg-pneutral-300 text-pneutral-500 cursor-not-allowed"
//             }`}
//           >
//             {isLoading || isNavigating ? 'Sending...' : 'Send Reset Link'}
//           </button>
//         </>
//       ) : (
//         <div className="text-center mb-6">
//           <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//             </svg>
//           </div>
//           <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
//             Reset Link Sent!
//           </h2>
//           <p className="text-sm text-pneutral-600 mb-3">
//             A password reset link has been sent to:
//           </p>
//           <p className="text-base font-semibold text-primary-700 mb-2">
//             {sentEmail}
//           </p>
//           <p className="text-xs text-neutral-400 mt-4">
//             Please check your email inbox. The link will expire in 24 hours.
//           </p>
//         </div>
//       )}

//       <button
//         onClick={() => {
//           // console.log("⬅️ Back to login from forgot password");
//           setStep("login");
//           setLinkSent(false);
//           setResetEmail("");
//         }}
//         className="text-sm text-center w-full text-primary-700 hover:underline"
//         disabled={isLoading || isNavigating}
//       >
//         ← Back to Login
//       </button>
//     </div>
//   );

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
//       <div
//         className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
//         onClick={onClose}
//       />

//       <div className="relative w-full max-w-5xl">
//         <button
//           onClick={onClose}
//           className="absolute -top-14 right-0 bg-secondary-700 text-pneutral-50 px-4 py-2 rounded-md flex items-center gap-2 transition shadow-lg"
//         >
//           <X size={16} />
//           Close
//         </button>

//         <div className="bg-primary-100 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
//           {/* Left Section - Carousel */}
//           <div 
//             className="w-1/2 flex flex-col items-center justify-center h-full relative"
//             onMouseEnter={handleMouseEnter}
//             onMouseLeave={handleMouseLeave}
//           >
//             <div className="relative w-full flex items-center justify-center">
//               <div className="flex items-center justify-center transition-all duration-500">
//                 <div className={`relative w-[187px] h-[252px] ${carouselSlides[currentSlide].imageBgColor} backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center overflow-hidden transition-colors duration-500`}>
//                   <Image
//                     src={carouselSlides[currentSlide].image}
//                     alt={`Slide ${currentSlide + 1}`}
//                     width={187}
//                     height={252}
//                     className="object-contain transition-all duration-500"
//                   />
//                 </div>

//                 <div className={`w-[187px] h-[200px] ${carouselSlides[currentSlide].textBgColor} rounded-r-lg shadow-md p-6 flex flex-col justify-center transition-colors duration-500`}>
//                   <h2 className="text-neutral-800 font-bold text-xl leading-snug">
//                     {carouselSlides[currentSlide].title}
//                   </h2>
//                   <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
//                     {carouselSlides[currentSlide].description}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="absolute bottom-8 flex gap-2">
//               {carouselSlides.map((slide, index) => (
//                 <button
//                   key={index}
//                   onClick={() => goToSlide(index)}
//                   className={`transition-all duration-200 ${
//                     index === currentSlide
//                       ? `w-6 h-2 ${slide.dotColor} rounded-full`
//                       : "w-2 h-2 bg-neutral-300 rounded-full hover:bg-primary-300"
//                   }`}
//                   aria-label={`Go to slide ${index + 1}`}
//                 />
//               ))}
//             </div>
//           </div>

//           {/* Right Section - Dynamic Forms */}
//           <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
//             {step === "login" && renderLoginStep()}
//             {step === "otp" && renderOTPStep()}
//             {step === "resetPassword" && renderResetPasswordStep()}
//             {step === "forgotPassword" && renderForgotPasswordStep()}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginModal;