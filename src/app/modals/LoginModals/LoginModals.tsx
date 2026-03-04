"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";
import { TbMailFilled } from "react-icons/tb";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginSchema, otpSchema, resetPasswordSchema, type LoginFormData, type OTPFormData, type ResetPasswordFormData } from "@/src/schema/seller/loginSchema";
import Link from "next/link";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const mockUsers = [
  {
    email: "seller@gmail.com",
    username: "seller_123",
    password: "Seller@123",
    role: "seller" as const,
    isFirstTimeLogin: true,
    coordinatorEmail: "seller@gmail.com", 
    coordinatorPhone: "9876543210", 
  },
  {
    email: "buyer@gmail.com",
    username: "buyer_123",
    password: "Buyer@123",
    role: "buyer" as const,
    isFirstTimeLogin: false,
    coordinatorEmail: "",
    coordinatorPhone: "",
  },
];

type AuthStep = "login" | "otp" | "resetPassword" | "forgotPassword";

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<AuthStep>("login");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isValid: isLoginValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // Reset password form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isValid: isResetValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onLogin = (data: LoginFormData) => {
    // Find user by email or username
    const user = mockUsers.find(
      (u) =>
        (u.email === data.email || u.username === data.email) &&
        u.password === data.password
    );

    if (user) {
      setCurrentUser(user);
      setUserRole(user.role);
      
      // Check if first-time login for seller
      if (user.role === "seller" && user.isFirstTimeLogin) {
        toast.success("First-time login detected. Please reset your password.");
        setStep("resetPassword");
      } else {
        toast.success("Login successful! Please verify OTP.");
        setStep("otp");
      }
    } else {
      toast.error("Invalid email/username or password.");
    }
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    // Simulate password reset
    if (data.newPassword === data.confirmPassword) {
      toast.success("Password reset successful! Please login with new password.");
      
      // Update mock user (in real app, this would be an API call)
      if (currentUser) {
        // eslint-disable-next-line react-hooks/immutability
        currentUser.isFirstTimeLogin = false;
        currentUser.password = data.newPassword;
      }
      
      setStep("login");
    }
  };

  const handleSendResetLink = () => {
    if (!resetEmail) {
      toast.error("Please enter your email/username");
      return;
    }

    const user = mockUsers.find(
      (u) => u.email === resetEmail || u.username === resetEmail
    );

    if (user && user.role === "seller") {
      setSentEmail(user.coordinatorEmail);
      setLinkSent(true);
    } else {
      toast.error("Seller account not found with this email/username");
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    try {
      otpSchema.parse({ otp: otpString });
      if (otpString === "123456") {
        toast.success("OTP verified successfully!");

        // Redirect based on role
        if (userRole === "seller") {
          router.push("/seller_7a3b9f2c/dashboard");
        } else if (userRole === "buyer") {
          router.push("/buyer_e8d45a1b");
        } else {
          toast.error("Something went wrong. Please login again.");
          setStep("login");
        }

        onClose();
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Invalid OTP");
    }
  };

  const isOtpValid = otp.join("").length === 6 && /^\d+$/.test(otp.join(""));

  const handleOtpChange = (value: string, index: number) => {
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
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("login");
      setOtp(Array(6).fill(""));
      setCurrentUser(null);
      setResetEmail("");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setLinkSent(false);
      setSentEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Render login step (original design preserved)
  const renderLoginStep = () => (
    <form onSubmit={handleLoginSubmit(onLogin)}>
      {/* Logo */}
      <div className="mb-10 flex justify-center">
        <Image
          src="/assets/images/tiameds.logo.png"
          alt="TiaMeds"
          width={234}
          height={108}
          priority
        />
      </div>

      {/* Login Title */}
      <h2 className="text-4xl text-center font-bold text-primary-900 mb-6">
        Login
      </h2>

      {/* Email Field */}
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
          />
        </div>
        {loginErrors.email ? (
          <p className="text-warning-500 text-xs mt-1">{loginErrors.email.message}</p>
        ) : (
          <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
        )}
      </div>

      {/* Password Field */}
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
          <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
        )}
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={!isLoginValid}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
          isLoginValid
            ? "bg-primary-900 text-white hover:bg-primary-800"
            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
        }`}
      >
        Login
        <Image
          src="/icons/loginIcon.svg"
          alt="Login"
          width={20}
          height={20}
        />
      </button>

      {/* Register Text */}
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

      {/* Forgot Password */}
      <p className="text-sm text-center mt-2">
        <button
          type="button"
          onClick={() => setStep("forgotPassword")}
          className="text-primary-900 underline cursor-pointer hover:text-primary-700"
        >
          Forgot your password?
        </button>
      </p>
    </form>
  );

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
      <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
        Reset Your Password
      </h2>

      {/* Description */}
      <p className="text-sm text-neutral-600 text-center mb-6">
        First-time login detected. Please set a new password.
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
            {...registerReset("newPassword")}
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
            {...registerReset("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
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

      {/* Reset Button */}
      <button
        type="submit"
        disabled={!isResetValid}
        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
          isResetValid
            ? "bg-primary-900 text-white hover:bg-primary-800"
            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
        }`}
      >
        Reset Password
      </button>

      {/* Back to Login */}
      <button
        type="button"
        onClick={() => setStep("login")}
        className="text-sm text-center w-full text-primary-700 hover:underline mt-2"
      >
        ← Back to Login
      </button>
    </form>
  );

  // Render forgot password step
  const renderForgotPasswordStep = () => {
    return (
      <div>
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
  
        {!linkSent ? (
          <>
            {/* Title */}
            <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
              Forgot Password
            </h2>
  
            {/* Description */}
            <p className="text-sm text-neutral-600 text-center mb-6">
              Enter your email/username. A reset link will be sent to your{" "}
              <span className="font-semibold">coordinator&apos;s registered email</span>
            </p>
  
            {/* Email Field */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <TbMailFilled className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email/Username"
                  className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
  
            {/* Send Reset Link Button */}
            <button
              onClick={handleSendResetLink}
              disabled={!resetEmail}
              className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
                resetEmail
                  ? "bg-primary-900 text-white hover:bg-primary-800"
                  : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              }`}
            >
              Send Reset Link
            </button>
          </>
        ) : (
          <>
            {/* Success Message */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-center text-primary-900 mb-2">
                Reset Link Sent!
              </h2>
              <p className="text-sm text-neutral-600 mb-3">
                A password reset link has been sent to your registered Email-Id at:
              </p>
              <p className="text-base font-semibold text-primary-700 mb-2">
                {sentEmail}
              </p>
              <p className="text-xs text-neutral-400 mt-4">
                Please check with your registered Email-Id.
              </p>
            </div>
          </>
        )}
  
        {/* Back to Login */}
        <button
          onClick={() => {
            setStep("login");
            setLinkSent(false);
            setResetEmail("");
          }}
          className="text-sm text-center w-full text-primary-700 hover:underline"
        >
          ← Back to Login
        </button>
      </div>
    );
  };

  // Render OTP step
  const renderOTPStep = () => (
    <>
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
      <h2 className="text-2xl font-semibold text-center text-black mb-2">
        Verify your mobile number
      </h2>

      {/* Description with coordinator info */}
      <p className="text-sm text-neutral-1000 text-center mb-1">
        We just sent a verification code to your coordinator
      </p>
      {currentUser && (
        <div className="text-center mb-3">
          <p className="text-xs text-neutral-500">{currentUser.coordinatorEmail}</p>
          <p className="text-xs text-neutral-500">{currentUser.coordinatorPhone}</p>
          <p className="text-xs text-success-600 mt-1">Use OTP: 123456</p>
        </div>
      )}

      {/* OTP Label */}
      <p className="text-center font-semibold text-neutral-900 mb-4">
        Enter your OTP code here
      </p>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg font-semibold rounded-md border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-800"
          />
        ))}
      </div>

      {/* Resend OTP */}
      <p className="text-center text-m text-neutral-900">
        Didn&apos;t receive the OTP?
      </p>
      <button 
        className="text-warning-500 font-medium text-center w-full hover:underline mt-1"
        onClick={() => toast.success("OTP 123456 resent to coordinator")}
      >
        Resend OTP
      </button>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={!isOtpValid}
        className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
          isOtpValid
            ? "bg-primary-900 text-white hover:bg-primary-800"
            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
        }`}
      >
        Verify
      </button>

      {/* Back to Login */}
      <button
        onClick={() => {
          setStep("login");
          setUserRole(null);
        }}
        className="text-sm text-center mt-3 text-primary-700 hover:underline"
      >
        ← Back to Login
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-5xl">
        {/* Close Button - Positioned Outside */}
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 bg-primary-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-900 transition shadow-lg"
        >
          <X size={16} />
          Close
        </button>

        {/* Modal Content */}
        <div className="bg-primary-05 rounded-2xl shadow-2xl h-[558px] px-8 flex items-center justify-between">
          {/* LEFT SECTION - unchanged */}
          <div className="w-1/2 flex flex-row items-center justify-center h-full relative">
            {/* Chart Card */}
            <div className="relative w-[187px] h-[252px] bg-neutral-50 backdrop-blur-md rounded-lg shadow-lg flex items-center justify-center">
              <Image
                src="/icons/imagechart1.png"
                alt="Chart"
                width={187}
                height={252}
                className="object-contain"
              />
            </div>

            {/* Text Card */}
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

            {/* Dots */}
            <div className="absolute bottom-30 flex gap-2">
              <span className="w-6 h-2 bg-primary-600 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
              <span className="w-2 h-2 bg-neutral-50 rounded-full" />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center overflow-y-auto">
            {step === "login" && renderLoginStep()}
            {step === "resetPassword" && renderResetPasswordStep()}
            {step === "forgotPassword" && renderForgotPasswordStep()}
            {step === "otp" && renderOTPStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;














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

//   const handleForgotPassword = () => {
//     if (!resetEmail) {
//       toast.error("Please enter your email/username");
//       return;
//     }

//     // Find user by email
//     const user = mockUsers.find(
//       (u) => u.email === resetEmail || u.username === resetEmail
//     );

//     if (user && user.role === "seller") {
//       toast.success(`Reset link sent to coordinator: ${user.coordinatorEmail}`);
//       toast.success(`OTP 123456 has been sent to ${user.coordinatorPhone}`);
//       setStep("login");
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
//   const renderForgotPasswordStep = () => (
//     <div>
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
//         Forgot Password
//       </h2>

//       {/* Description */}
//       <p className="text-sm text-neutral-600 text-center mb-6">
//   Enter your email/username. A reset link will be sent to your <span className="font-semibold">coordinator&apos;s registered email</span>
// </p>

//       {/* Email Field */}
//       <div className="mb-6">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//             <TbMailFilled className="w-5 h-5" />
//           </div>
//           <input
//             type="text"
//             value={resetEmail}
//             onChange={(e) => setResetEmail(e.target.value)}
//             placeholder="Enter your email/Username"
//             className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//           />
//         </div>
//       </div>

//       {/* Send Reset Link Button */}
//       <button
//         onClick={handleForgotPassword}
//         disabled={!resetEmail}
//         className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-4 ${
//           resetEmail
//             ? "bg-primary-900 text-white hover:bg-primary-800"
//             : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//         }`}
//       >
//         Send Reset Link
//       </button>

//       {/* Back to Login */}
//       <button
//         onClick={() => setStep("login")}
//         className="text-sm text-center w-full text-primary-700 hover:underline"
//       >
//         ← Back to Login
//       </button>
//     </div>
//   );

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




































// "use client";

// import { useState, useRef } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { X, Eye, EyeOff } from "lucide-react";
// import { TbMailFilled } from "react-icons/tb";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import toast from "react-hot-toast";
// import { loginSchema, otpSchema, type LoginFormData, type OTPFormData } from "@/src/schema/seller/loginSchema";
// import Link from "next/link";

// interface LoginModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// // Dummy users data
// const dummyUsers = [
//   {
//     email: "seller@gmail.com",
//     username: "seller_123",
//     password: "Seller@123",
//     role: "seller" as const,
//   },
//   {
//     email: "buyer@gmail.com",
//     username: "buyer_123",
//     password: "Buyer@123",
//     role: "buyer" as const,
//   },
// ];

// const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);
//   const [step, setStep] = useState<"login" | "otp">("login");
//   const [otp, setOtp] = useState(Array(6).fill(""));
//   const [userRole, setUserRole] = useState<"seller" | "buyer" | null>(null);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

//   // Login form
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isValid },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     mode: "onChange",
//   });

//   const onLogin = (data: LoginFormData) => {
//     // Find user by email or username
//     const user = dummyUsers.find(
//       (u) =>
//         (u.email === data.email || u.username === data.email) &&
//         u.password === data.password
//     );

//     if (user) {
//       setUserRole(user.role);
//       toast.success("Login successful! Please verify OTP.");
//       setStep("otp");
//     } else {
//       toast.error("Invalid email/username or password.");
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
//           // Fallback if role not set (should not happen)
//           toast.error("Something went wrong. Please login again.");
//           setStep("login");
//         }

//         onClose(); // close modal after redirect (optional)
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

//   if (!isOpen) return null;

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
//           {/* LEFT SECTION */}
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
//           <div className="w-[444px] h-[520px] bg-secondary-50 px-16 shadow-lg flex flex-col justify-center">
//             {step === "login" && (
//               <form onSubmit={handleSubmit(onLogin)}>
//                 {/* Logo */}
//                 <div className="mb-10 flex justify-center">
//                   <Image
//                     src="/assets/images/tiameds.logo.png"
//                     alt="TiaMeds"
//                     width={234}
//                     height={108}
//                     priority
//                   />
//                 </div>

//                 {/* Login Title */}
//                 <h2 className="text-4xl text-center font-bold text-primary-900 mb-6">
//                   Login
//                 </h2>

//                 {/* Email Field */}
//                 <div className="mb-4">
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                       <TbMailFilled className="w-5 h-5" />
//                     </div>
//                     <input
//                       {...register("email")}
//                       type="text"
//                       placeholder="Enter your email/Username"
//                       className="w-full h-12 pl-12 pr-4 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//                     />
//                   </div>
//                   {errors.email ? (
//                     <p className="text-warning-500 text-xs mt-1">{errors.email.message}</p>
//                   ) : (
//                     <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
//                   )}
//                 </div>

//                 {/* Password Field */}
//                 <div className="mb-6">
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                       <Image
//                         src="/icons/password.svg"
//                         alt="Lock"
//                         width={20}
//                         height={20}
//                         className="text-neutral-500"
//                       />
//                     </div>
//                     <input
//                       {...register("password")}
//                       type={showPassword ? "text" : "password"}
//                       placeholder="Password"
//                       className="w-full h-12 pl-12 pr-12 leading-none rounded-lg border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-600"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
//                     >
//                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                     </button>
//                   </div>
//                   {errors.password ? (
//                     <p className="text-warning-500 text-xs mt-1">{errors.password.message}</p>
//                   ) : (
//                     <p className="text-warning-500 text-xs mt-1">Supporting Text</p>
//                   )}
//                 </div>

//                 {/* Login Button */}
//                 <button
//                   type="submit"
//                   disabled={!isValid}
//                   className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 ${
//                     isValid
//                       ? "bg-primary-900 text-white hover:bg-primary-800"
//                       : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//                   }`}
//                 >
//                   Login
//                   <Image
//                     src="/icons/loginIcon.svg"
//                     alt="Login"
//                     width={20}
//                     height={20}
//                   />
//                 </button>

//                 {/* Register Text */}
//                 <p className="text-sm text-neutral-900 text-center">
//                   Don&apos;t have an account?{" "}
//                    <Link 
//                     href="/register" 
//                     onClick={onClose}
//                     className="text-primary-700 font-medium cursor-pointer hover:underline inline-block"
//                   >
//                     Register Now
//                   </Link>
//                 </p>

//                 {/* Forgot Password */}
//                 <p className="text-sm text-center mt-2">
//                   <span className="text-primary-900 underline cursor-pointer hover:text-primary-700">
//                     Forgot your password?
//                   </span>
//                 </p>
//               </form>
//             )}

//             {step === "otp" && (
//               <>
//                 {/* Logo */}
//                 <div className="mb-6 flex justify-center">
//                   <Image
//                     src="/assets/images/tiameds.logo.png"
//                     alt="TiaMeds"
//                     width={200}
//                     height={90}
//                     priority
//                   />
//                 </div>

//                 {/* Title */}
//                 <h2 className="text-2xl font-semibold text-center text-black mb-2">
//                   Verify your mobile number
//                 </h2>

//                 {/* Description */}
//                 <p className="text-sm text-neutral-1000 text-center mb-4">
//                   We just sent you a verification code to your phone number
//                 </p>

//                 {/* OTP Label */}
//                 <p className="text-center font-semibold text-neutral-900 mb-4">
//                   Enter your OTP code here
//                 </p>

//                 {/* OTP Inputs */}
//                 <div className="flex justify-center gap-3 mb-6">
//                   {otp.map((digit, index) => (
//                     <input
//                       key={index}
//                       ref={(el) => {
//                         inputRefs.current[index] = el;
//                       }}
//                       type="text"
//                       maxLength={1}
//                       value={digit}
//                       onChange={(e) => handleOtpChange(e.target.value, index)}
//                       onKeyDown={(e) => handleKeyDown(e, index)}
//                       className="w-12 h-12 text-center text-lg font-semibold rounded-md border border-neutral-300 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-800"
//                     />
//                   ))}
//                 </div>

//                 {/* Resend OTP */}
//                 <p className="text-center text-m text-neutral-900">
//                   Didn&apos;t receive the OTP?
//                 </p>
//                 <button className="text-warning-500 font-medium text-center w-full hover:underline mt-1">
//                   Resend OTP
//                 </button>

//                 {/* Verify Button */}
//                 <button
//                   onClick={handleVerify}
//                   disabled={!isOtpValid}
//                   className={`w-full h-12 rounded-lg transition-all duration-200 active:scale-[0.98] mt-6 ${
//                     isOtpValid
//                       ? "bg-primary-900 text-white hover:bg-primary-800"
//                       : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
//                   }`}
//                 >
//                   Verify
//                 </button>

//                 {/* Back to Login */}
//                 <button
//                   onClick={() => {
//                     setStep("login");
//                     setUserRole(null);
//                   }}
//                   className="text-sm text-center mt-3 text-primary-700 hover:underline"
//                 >
//                   ← Back to Login
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginModal;