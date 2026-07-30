"use client";
import React, { useRef, useState, useEffect } from "react";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import Image from "next/image";

interface Props {
  show: boolean;
  label: string;
  type: "email" | "phone";
  onClose: () => void;
  onVerified: () => void;
  onResend: () => Promise<void>;
  // Optional override for the verify call — defaults to the temp-seller
  // registration email/SMS OTP endpoints below. Pass this to reuse the modal
  // for other OTP flows (e.g. signup) without forking the component.
  onVerify?: (otp: string) => Promise<void>;
}

export default function VerificationModal({
  show,
  label,
  onClose,
  onVerified,
  type,
  onResend,
  onVerify,
}: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState<string>("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setOtp(["", "", "", "", "", ""]);
      setIsVerifying(false);
      setError("");

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
    }
  }, [show]);


  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }

    return () => clearTimeout(timer);
  }, [resendCountdown, canResend]);

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");

    if (clean.startsWith("91") && clean.length === 12) {
      return `+${clean}`;
    }

    if (clean.length === 10) {
      return `+91${clean}`;
    }

    return `+${clean}`;
  };

  const verifyOtpNow = async (enteredOtp: string) => {
    setIsVerifying(true);
    setError("");

    try {
      if (onVerify) {
        await onVerify(enteredOtp);
      } else if (type === "email") {
        await sellerRegService.verifyEmailOtp({
          email: label,
          otp: enteredOtp,
        });
      } else {
        const phoneWithPrefix = formatPhone(label);

        await sellerRegService.verifySMSOtp({
          phone: phoneWithPrefix,
          otp: enteredOtp,
        });
      }

      onVerified();
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        error?.message ||
        "Invalid OTP. Please try again.";

      if (statusCode === 400 && msg === "Request processed successfully") {
        onVerified();
        return;
      }

      setOtp(["", "", "", "", "", ""]);
      setError(msg);

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 50);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const enteredOtp = newOtp.join("");

      if (enteredOtp.length === 6) {
        setTimeout(() => {
          verifyOtpNow(enteredOtp);
        }, 50);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const pasteData = e.clipboardData.getData("text").trim();

    if (!/^\d{6}$/.test(pasteData)) {
      setError("Please paste a valid 6-digit code");
      return;
    }

    const newOtp = pasteData.split("");
    setOtp(newOtp);
    setError("");

    setTimeout(() => {
      verifyOtpNow(pasteData);
    }, 50);

    setTimeout(() => {
      inputs.current[5]?.focus();
    }, 10);
  };

  const verify = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    verifyOtpNow(enteredOtp);
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendCountdown(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");

    try {
      await onResend();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Failed to resend code. Please try again.";

      setError(msg);
    }

    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 50);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="relative w-100 bg-white rounded-xl shadow-lg p-6 text-center"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-pneutral-500 hover:text-pneutral-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${
              type === "email" ? "bg-secondary-100" : "bg-secondary-100"
            }`}
          >
            {type === "email" ? (
              <Image
                src="/icons/emailVerIcon.png"
                alt="Email Icon"
                width={85}
                height={40}
                className="object-contain"
              />
            ) : (
              <Image
                src="/icons/mobVerIcon.png"
                alt="Mobile Icon"
                width={85}
                height={40}
                className="object-contain"
              />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-h4 font-heading font-medium text-pneutral-900 leading-[36px] mb-1">
          {type === "email"
            ? "Verify your email"
            : "Verify your mobile number"}
        </h2>

        {/* Subtitle */}
        <p className="text-p3 font-body font-regular text-pneutral-600 leading-[20px] mb-4">
          We just sent you a verification code to your{" "}
          {type === "email" ? "email id" : "phone number"}
        </p>

        {/* OTP Label */}
        <p className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px] mb-4">
          Enter your OTP code here
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-12 bg-white text-center text-h6 font-heading font-semibold text-pneutral-900 border border-neutral-500 rounded-xl focus:outline-none focus:ring-0 focus:border-primary-500"
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-p2 font-body font-regular text-red-500 mb-4">
            {error}
          </p>
        )}

        

        {/* Resend Section */}
        <div className="mt-5">
          <p className="text-p3 font-body font-regular text-pneutral-800">
            Didn&apos;t receive the OTP?
          </p>

          <button
            onClick={handleResendCode}
            disabled={!canResend}
            className="text-p3 font-body text-warning-500 mt-1 disabled:text-neutral-400"
          >
            {canResend ? "Resend OTP" : `Resend in ${resendCountdown}s`}
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={verify}
          disabled={isVerifying || otp.join("").length !== 6}
          className="w-37.5 h-13 px-4 rounded-xl bg-primary-800 mt-3 text-white font-semibold transition-none"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}





// old code as per old global css ............19.05.2026

// "use client";
// import React, { useRef, useState, useEffect } from "react";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import Image from "next/image";

// interface Props {
//   show: boolean;
//   label: string;
//   type: "email" | "phone";
//   onClose: () => void;
//   onVerified: () => void;
//   onResend: () => Promise<void>;
// }

// export default function VerificationModal({
//   show,
//   label,
//   onClose,
//   onVerified,
//   type,
//   onResend,
// }: Props) {
//   const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [canResend, setCanResend] = useState(true);
//   const [resendCountdown, setResendCountdown] = useState(0);
//   const [error, setError] = useState<string>("");

//   const inputs = useRef<(HTMLInputElement | null)[]>([]);
//   const modalRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (show) {
//       setOtp(["", "", "", "", "", ""]);
//       setIsVerifying(false);
//       setError("");

//       setTimeout(() => {
//         inputs.current[0]?.focus();
//       }, 50);
//     }
//   }, [show]);

//   // click outside handler
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         show &&
//         modalRef.current &&
//         !modalRef.current.contains(event.target as Node)
//       ) {
//         onClose();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [show, onClose]);

//   // escape key handler
//   useEffect(() => {
//     const handleEscKey = (event: KeyboardEvent) => {
//       if (show && event.key === "Escape") {
//         onClose();
//       }
//     };

//     document.addEventListener("keydown", handleEscKey);

//     return () => {
//       document.removeEventListener("keydown", handleEscKey);
//     };
//   }, [show, onClose]);

//   useEffect(() => {
//     let timer: NodeJS.Timeout;

//     if (resendCountdown > 0) {
//       timer = setTimeout(() => {
//         setResendCountdown((prev) => prev - 1);
//       }, 1000);
//     } else if (resendCountdown === 0 && !canResend) {
//       setCanResend(true);
//     }

//     return () => clearTimeout(timer);
//   }, [resendCountdown, canResend]);

//   const formatPhone = (phone: string) => {
//     const clean = phone.replace(/\D/g, "");

//     if (clean.startsWith("91") && clean.length === 12) {
//       return `+${clean}`;
//     }

//     if (clean.length === 10) {
//       return `+91${clean}`;
//     }

//     return `+${clean}`;
//   };

//   // ===================== NEW COMMON VERIFY FUNCTION =====================
//  const verifyOtpNow = async (enteredOtp: string) => {
//   setIsVerifying(true);
//   setError("");

//   try {
//     let response: any;

//     if (type === "email") {
//       response = await sellerRegService.verifyEmailOtp({
//         email: label,
//         otp: enteredOtp,
//       });
//     } else {
//       const phoneWithPrefix = formatPhone(label);

//       response = await sellerRegService.verifySMSOtp({
//         phone: phoneWithPrefix,
//         otp: enteredOtp,
//       });
//     }

//     onVerified();

//   } catch (error: any) {
//     const statusCode = error?.response?.status;

//     const msg =
//       error?.response?.data?.message ||
//       error?.response?.data?.data?.message ||
//       error?.message ||
//       "Invalid OTP. Please try again.";

//     // ✅ Only special case:
//     // backend wrongly sends 400 + success message
//     if (
//       statusCode === 400 &&
//       msg === "Request processed successfully"
//     ) {
//       onVerified();
//       return;
//     }

//     // ❌ real invalid otp
//     setOtp(["", "", "", "", "", ""]);
//     setError(msg);

//     setTimeout(() => {
//       inputs.current[0]?.focus();
//     }, 50);
//   } finally {
//     setIsVerifying(false);
//   }
// };



//   const handleChange = (value: string, index: number) => {
//     if (!/^\d?$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;

//     setOtp(newOtp);
//     setError("");

//     if (value && index < 5) {
//       inputs.current[index + 1]?.focus();
//     }

//     // auto verify after 6 digits
//     if (value && index === 5) {
//       const enteredOtp = newOtp.join("");

//       if (enteredOtp.length === 6) {
//         setTimeout(() => {
//           verifyOtpNow(enteredOtp);
//         }, 50);
//       }
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputs.current[index - 1]?.focus();
//     }

//     if (e.key === "ArrowLeft" && index > 0) {
//       e.preventDefault();
//       inputs.current[index - 1]?.focus();
//     }

//     if (e.key === "ArrowRight" && index < 5) {
//       e.preventDefault();
//       inputs.current[index + 1]?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();

//     const pasteData = e.clipboardData.getData("text").trim();

//     if (!/^\d{6}$/.test(pasteData)) {
//       setError("Please paste a valid 6-digit code");
//       return;
//     }

//     const newOtp = pasteData.split("");
//     setOtp(newOtp);
//     setError("");

//     setTimeout(() => {
//       verifyOtpNow(pasteData);
//     }, 50);

//     setTimeout(() => {
//       inputs.current[5]?.focus();
//     }, 10);
//   };

//   const verify = async () => {
//     const enteredOtp = otp.join("");

//     if (enteredOtp.length !== 6) {
//       setError("Please enter all 6 digits");
//       return;
//     }

//     verifyOtpNow(enteredOtp);
//   };

//   const handleResendCode = async () => {
//     if (!canResend) return;

//     setCanResend(false);
//     setResendCountdown(30);
//     setOtp(["", "", "", "", "", ""]);
//     setError("");

//     try {
//       await onResend();
//     } catch (error: any) {
//       const msg =
//         error?.response?.data?.message ||
//         "Failed to resend code. Please try again.";

//       setError(msg);
//     }

//     setTimeout(() => {
//       inputs.current[0]?.focus();
//     }, 50);
//   };

//   if (!show) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
//       onClick={onClose}
//     >
//       <div
//         ref={modalRef}
//         className="w-90 bg-white rounded-xl shadow-lg p-8 text-center"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Icon */}
//         <div className="flex justify-center mb-4">
//           <div
//             className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${
//               type === "email" ? "bg-purple-200" : "bg-red-200"
//             }`}
//           >
//             {type === "email" ? (
//               <Image
//                 src="/icons/emailVerIcon.png"
//                 alt="Email Icon"
//                 width={85}
//                 height={40}
//                 className="object-contain"
//               />
//             ) : (
//               <Image
//                 src="/icons/mobVerIcon.png"
//                 alt="Mobile Icon"
//                 width={85}
//                 height={40}
//                 className="object-contain"
//               />
//             )}
//           </div>
//         </div>

//         {/* Title */}
//         <h2 className="text-2xl font-semibold text-neutral-900 mb-1">
//           {type === "email"
//             ? "Verify your email"
//             : "Verify your mobile number"}
//         </h2>

//         {/* Subtitle */}
//         <p className="text-sm text-neutral-600 mb-4">
//           We just sent you a verification code to your{" "}
//           {type === "email" ? "email id" : "phone number"}
//         </p>

//         {/* OTP Label */}
//         <p className="text-xl font-medium text-neutral-800 mb-4">
//           Enter your OTP code here
//         </p>

//         {/* OTP Inputs */}
//         <div className="flex justify-center gap-2 mb-6">
//           {otp.map((digit, index) => (
//             <input
//               key={index}
//               ref={(el) => {
//                 inputs.current[index] = el;
//               }}
//               type="text"
//               maxLength={1}
//               value={digit}
//               onChange={(e) => handleChange(e.target.value, index)}
//               onKeyDown={(e) => handleKeyDown(e, index)}
//               onPaste={handlePaste}
//               className="w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
//             />
//           ))}
//         </div>

//         {/* Error */}
//         {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

//         {/* Verify */}
//         <button
//           onClick={verify}
//           disabled={isVerifying || otp.join("").length !== 6}
//           className="w-37.5 h-12 py-3 rounded-md bg-primary-900 text-white font-medium transition disabled:opacity-60"
//         >
//           {isVerifying ? "Verifying..." : "Verify"}
//         </button>

//         {/* Resend */}
//         <div className="mt-5 text-xl">
//           <p className="text-neutral-800">Didn&apos;t receive the OTP?</p>

//           <button
//             onClick={handleResendCode}
//             disabled={!canResend}
//             className="text-warning-500 font-large mt-1 hover:underline disabled:text-neutral-400"
//           >
//             {canResend ? "Resend OTP" : `Resend in ${resendCountdown}s`}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }