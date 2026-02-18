"use client";
import React, { useRef, useState, useEffect } from "react";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

interface Props {
  show: boolean;
  label: string;
  type: "email" | "phone";
  onClose: () => void;
  onVerified: () => void;
  onResend: () => Promise<void>;
}

export default function VerificationModal({ 
  show, 
  label, 
  onClose, 
  onVerified, 
  type, 
  onResend 
}: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState<string>("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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
        setResendCountdown(resendCountdown - 1);
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

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    
    // Create new OTP array with the updated value
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Auto-verify when 6th digit is entered
    if (value && index === 5) {
      // Use newOtp instead of otp state
      const enteredOtp = newOtp.join("");
      if (enteredOtp.length === 6) {
        // Add a small delay to ensure UI updates
        setTimeout(async () => {
          setIsVerifying(true);
          try {
            if (type === "email") {
              await sellerRegService.verifyEmailOtp({
                email: label,
                otp: enteredOtp
              });
            } else {
              const phoneWithPrefix = formatPhone(label);
              console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
              
              const response = await sellerRegService.verifySMSOtp({
                phone: phoneWithPrefix,
                otp: enteredOtp
              });
              
              console.log('✅ OTP verified:', response);
            }
            onVerified();
            onClose();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            console.error('❌ Verification failed:', error);
            
            if (error.message && error.message.includes('Authenticate')) {
              setError("Authentication failed. Please check your API configuration.");
            } else if (error.message) {
              setError(error.message);
            } else {
              setError("Invalid OTP. Please try again.");
            }
            
            setOtp(["", "", "", "", "", ""]);
          } finally {
            setIsVerifying(false);
          }
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
    const pasteData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp as string[]);
      setError("");
      
      // Auto-verify after paste
      setTimeout(async () => {
        setIsVerifying(true);
        try {
          if (type === "email") {
            await sellerRegService.verifyEmailOtp({
              email: label,
              otp: pasteData
            });
          } else {
            const phoneWithPrefix = formatPhone(label);
            await sellerRegService.verifySMSOtp({
              phone: phoneWithPrefix,
              otp: pasteData
            });
          }
          onVerified();
          onClose();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          setError(error.message || "Invalid OTP. Please try again.");
          setOtp(["", "", "", "", "", ""]);
        } finally {
          setIsVerifying(false);
        }
      }, 50);
      
      setTimeout(() => {
        inputs.current[5]?.focus();
      }, 10);
    } else {
      setError("Please paste a valid 6-digit code");
    }
  };

  const verify = async () => {
    const enteredOtp = otp.join("");
    
    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    
    setIsVerifying(true);
    setError("");
    
    try {
      if (type === "email") {
        await sellerRegService.verifyEmailOtp({
          email: label,
          otp: enteredOtp
        });
      } else {
        const phoneWithPrefix = formatPhone(label);
        console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
        
        const response = await sellerRegService.verifySMSOtp({
          phone: phoneWithPrefix,
          otp: enteredOtp
        });
        
        console.log('✅ OTP verified:', response);
      }
      
      onVerified();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Verification failed:', error);
      
      if (error.message && error.message.includes('Authenticate')) {
        setError("Authentication failed. Please check your API configuration.");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Invalid OTP. Please try again.");
      }
      
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendCountdown(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    
    try {
      console.log(`🔄 Resending ${type} OTP to:`, label);
      await onResend();
      console.log(`✅ ${type} OTP resent successfully`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`❌ Failed to resend ${type} OTP:`, error);
      
      let errorMessage = "Failed to resend code. Please try again.";
      
      if (error.response) {
        const backendMessage = error.response.data?.message;
        if (backendMessage) {
          errorMessage = backendMessage;
        }
      }
      
      setError(errorMessage);
    }
    
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 50);
  };

  const clearError = () => {
    setError("");
  };

  if (!show) return null;

  // Using your color variables
  const primaryColor = type === "email" ? "primary-600" : "success-300";
  const primaryLight = type === "email" ? "primary-100" : "success-100";
  // const primaryBorder = type === "email" ? "primary-200" : "success-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-[320px]">
        <div className="relative rounded-2xl shadow-xl overflow-hidden bg-white border-2 border-primary-200">
          {/* Header */}
          <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, var(--${primaryLight}), var(--${type === "email" ? "primary-200" : "success-200"}))` }}>
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 bg-white shadow-md`}>
              {type === "email" ? (
                <i className="bi bi-envelope text-primary-700 text-xl"></i>
              ) : (
                <i className="bi bi-phone text-success-300 text-xl"></i>
              )}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Verify {type === "email" ? "Email" : "Phone"}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Code sent to <span className={`font-medium text-${primaryColor}`}>{label}</span>
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="p-4">
            <div className="flex justify-between gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onClick={clearError}
                  className={`w-10 h-12 text-center text-base font-bold rounded-xl border-2 bg-neutral-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-${primaryColor} transition-all ${
                    error 
                      ? 'border-error-300 text-error-300' 
                      : digit 
                        ? `border-${primaryColor} text-${primaryColor}`
                        : 'border-primary-200 text-neutral-900'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-3 text-sm text-error-300 bg-error-100 rounded-xl border border-error-200 flex items-center">
                <i className="bi bi-exclamation-circle text-base mr-2"></i>
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={verify}
              disabled={isVerifying || otp.join("").length !== 6}
              className={`w-full py-3 rounded-xl text-base font-semibold text-white mb-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                type === "email" 
                  ? "bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800" 
                  : "bg-linear-to-r from-success-300 to-success-200 hover:from-success-400 hover:to-success-300"
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center">
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Verifying...
                </span>
              ) : "Verify"}
            </button>

            {/* Resend Code */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className={`text-sm flex items-center gap-1 ${
                  canResend 
                    ? `text-${primaryColor} hover:text-${type === "email" ? "primary-800" : "success-400"}`
                    : "text-neutral-400"
                }`}
              >
                {canResend ? (
                  <>
                    <i className="bi bi-arrow-clockwise"></i>
                    Resend Code
                  </>
                ) : `Resend in ${resendCountdown}s`}
              </button>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-neutral-200">
              <p className="text-xs text-center text-neutral-500">
                <i className="bi bi-clock mr-1"></i> Code expires in 5 minutes
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}














// this code with backend integrated with email but nnot for sms.....................
// "use client";
// import React, { useRef, useState, useEffect } from "react";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

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
//   onResend 
// }: Props) {
//   const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [canResend, setCanResend] = useState(true);
//   const [resendCountdown, setResendCountdown] = useState(0);
//   const [error, setError] = useState<string>("");
//   const inputs = useRef<(HTMLInputElement | null)[]>([]);

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

//   useEffect(() => {
//     let timer: NodeJS.Timeout;
//     if (resendCountdown > 0) {
//       timer = setTimeout(() => {
//         setResendCountdown(resendCountdown - 1);
//       }, 1000);
//     } else if (resendCountdown === 0 && !canResend) {
//       setCanResend(true);
//     }
//     return () => clearTimeout(timer);
//   }, [resendCountdown, canResend]);

//   const handleChange = (value: string, index: number) => {
//     if (!/^\d?$/.test(value)) return;
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError("");
    
//     if (value && index < 5) {
//       inputs.current[index + 1]?.focus();
//     }
    
//     if (value && index === 5) {
//       setTimeout(() => {
//         const enteredOtp = [...newOtp].join("");
//         if (enteredOtp.length === 6) {
//           verify();
//         }
//       }, 10);
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
//     const pasteData = e.clipboardData.getData('text').trim();
    
//     if (/^\d{6}$/.test(pasteData)) {
//       const newOtp = pasteData.split('');
//       setOtp(newOtp as string[]);
//       setError("");
//       setTimeout(() => {
//         inputs.current[5]?.focus();
//       }, 10);
//     } else {
//       setError("Please paste a valid 6-digit code");
//     }
//   };

//   const verify = async () => {
//     const enteredOtp = otp.join("");
    
//     if (enteredOtp.length !== 6) {
//       setError("Please enter all 6 digits");
//       return;
//     }
    
//     if (!/^\d{6}$/.test(enteredOtp)) {
//       setError("Please enter a valid 6-digit code");
//       return;
//     }
    
//     setIsVerifying(true);
//     setError("");
    
//     try {
//       console.log(`🔍 Verifying ${type} OTP for:`, label);
      
//       // ===== CHECK FOR TEST MODE (SMS ONLY) =====
//       if (type === "phone") {
//         const isTestMode = sessionStorage.getItem('sms_test_mode') === 'true';
//         const testOtp = sessionStorage.getItem('test_otp');
//         const testPhone = sessionStorage.getItem('test_phone');
        
//         console.log("🧪 Test mode check:", { isTestMode, testOtp, testPhone, label });
        
//         // If in test mode and OTP matches, bypass backend verification
//         if (isTestMode && testOtp === enteredOtp && testPhone === label) {
//           console.log("✅ TEST MODE: Bypassing backend verification");
//           console.log(`✅ Test OTP verified successfully for ${label}`);
          
//           // Clear test data
//           sessionStorage.removeItem('sms_test_mode');
//           sessionStorage.removeItem('test_otp');
//           sessionStorage.removeItem('test_phone');
          
//           setTimeout(() => {
//             onVerified();
//             onClose();
//             setIsVerifying(false);
//           }, 500);
//           return;
//         }
//       }
      
//       // ===== BACKEND VERIFICATION (Email OR SMS when not in test mode) =====
//       if (type === "email") {
//         const response = await sellerRegService.verifyEmailOtp({
//           email: label,
//           otp: enteredOtp
//         });
//         console.log(`✅ Email OTP verified successfully:`, response);
//       } else {
//         // Only try backend SMS verification if NOT in test mode
//         console.log("📡 Verifying SMS OTP via backend...");
//         const response = await sellerRegService.verifySMSOtp({
//           phone: label,
//           otp: enteredOtp
//         });
//         console.log(`✅ SMS OTP verified successfully:`, response);
//       }
      
//       // Success - call onVerified and close modal
//       setTimeout(() => {
//         onVerified();
//         onClose();
//         setIsVerifying(false);
//       }, 500);
      
//     } catch (error: any) {
//       console.error(`❌ ${type} OTP verification failed:`, error);
      
//       // Handle specific error messages
//       let errorMessage = "Invalid OTP. Please try again.";
      
//       if (error.response) {
//         // Backend returned an error
//         errorMessage = error.response.data?.message || 
//                       `Verification failed (${error.response.status})`;
        
//         if (error.response.status === 500) {
//           errorMessage = "SMS verification service is temporarily unavailable. Please try again later.";
//         }
//       } else if (error.request) {
//         // No response received
//         errorMessage = "No response from server. Please check your connection.";
//       } else {
//         // Something else
//         errorMessage = error.message || errorMessage;
//       }
      
//       setError(errorMessage);
//       setOtp(["", "", "", "", "", ""]);
//       setIsVerifying(false);
      
//       setTimeout(() => {
//         inputs.current[0]?.focus();
//       }, 50);
//     }
//   };

//   const handleResendCode = async () => {
//     if (!canResend) return;
    
//     setCanResend(false);
//     setResendCountdown(30);
//     setOtp(["", "", "", "", "", ""]);
//     setError("");
    
//     try {
//       console.log(`🔄 Resending ${type} OTP to:`, label);
      
//       // ===== TEST MODE RESEND =====
//       if (type === "phone") {
//         const isTestMode = sessionStorage.getItem('sms_test_mode') === 'true';
//         if (isTestMode) {
//           console.log("🧪 TEST MODE: Resending test OTP");
//           sessionStorage.setItem('test_otp', '123456');
//           sessionStorage.setItem('test_phone', label);
//         }
//       }
      
//       await onResend();
//       console.log(`✅ ${type} OTP resent successfully`);
//     } catch (error) {
//       console.error(`❌ Failed to resend ${type} OTP:`, error);
//       setError("Failed to resend code. Please try again.");
//     }
    
//     setTimeout(() => {
//       inputs.current[0]?.focus();
//     }, 50);
//   };

//   const clearError = () => {
//     setError("");
//   };

//   if (!show) return null;

//   // Using your color variables
//   const primaryColor = type === "email" ? "primary-600" : "success-300";
//   const primaryLight = type === "email" ? "primary-100" : "success-100";
//   const primaryBorder = type === "email" ? "primary-200" : "success-200";

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//       <div className="relative w-full max-w-[320px]">
//         <div className="relative rounded-2xl shadow-xl overflow-hidden bg-white border-2 border-primary-200">
//           {/* Header */}
//           <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, var(--${primaryLight}), var(--${type === "email" ? "primary-200" : "success-200"}))` }}>
//             <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 bg-white shadow-md`}>
//               {type === "email" ? (
//                 <i className="bi bi-envelope text-primary-700 text-xl"></i>
//               ) : (
//                 <i className="bi bi-phone text-success-300 text-xl"></i>
//               )}
//             </div>
//             <h2 className="text-lg font-bold text-neutral-900">
//               Verify {type === "email" ? "Email" : "Phone"}
//             </h2>
//             <p className="text-sm text-neutral-600 mt-1">
//               Code sent to <span className={`font-medium text-${primaryColor}`}>{label}</span>
//             </p>
//           </div>

//           {/* OTP Inputs */}
//           <div className="p-4">
//             <div className="flex justify-between gap-2 mb-4">
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   ref={(el) => { inputs.current[index] = el; }}
//                   type="text"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) => handleChange(e.target.value, index)}
//                   onKeyDown={(e) => handleKeyDown(e, index)}
//                   onPaste={handlePaste}
//                   onClick={clearError}
//                   className={`w-10 h-12 text-center text-base font-bold rounded-xl border-2 bg-neutral-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-${primaryColor} transition-all ${
//                     error 
//                       ? 'border-error-300 text-error-300' 
//                       : digit 
//                         ? `border-${primaryColor} text-${primaryColor}`
//                         : 'border-primary-200 text-neutral-900'
//                   }`}
//                 />
//               ))}
//             </div>

//             {/* Error Message */}
//             {error && (
//               <div className="mb-3 p-3 text-sm text-error-300 bg-error-100 rounded-xl border border-error-200 flex items-center">
//                 <i className="bi bi-exclamation-circle text-base mr-2"></i>
//                 {error}
//               </div>
//             )}

//             {/* Test Mode Indicator for Phone */}
//             {type === "phone" && sessionStorage.getItem('sms_test_mode') === 'true' && (
//               <div className="mb-3 p-2 text-xs text-warning-600 bg-warning-100 rounded-lg border border-warning-200 flex items-center">
//                 <i className="bi bi-tools mr-2"></i>
//                 TEST MODE: Use OTP 123456
//               </div>
//             )}

//             {/* Verify Button */}
//             <button
//               type="button"
//               onClick={verify}
//               disabled={isVerifying || otp.join("").length !== 6}
//               className={`w-full py-3 rounded-xl text-base font-semibold text-white mb-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
//                 type === "email" 
//                   ? "bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800" 
//                   : "bg-linear-to-r from-success-300 to-success-200 hover:from-success-400 hover:to-success-300"
//               }`}
//             >
//               {isVerifying ? (
//                 <span className="flex items-center justify-center">
//                   <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
//                   Verifying...
//                 </span>
//               ) : "Verify"}
//             </button>

//             {/* Resend Code */}
//             <div className="flex items-center justify-between mb-2">
//               <button
//                 type="button"
//                 onClick={handleResendCode}
//                 disabled={!canResend}
//                 className={`text-sm flex items-center gap-1 ${
//                   canResend 
//                     ? `text-${primaryColor} hover:text-${type === "email" ? "primary-800" : "success-400"}`
//                     : "text-neutral-400"
//                 }`}
//               >
//                 {canResend ? (
//                   <>
//                     <i className="bi bi-arrow-clockwise"></i>
//                     Resend Code
//                   </>
//                 ) : `Resend in ${resendCountdown}s`}
//               </button>
//             </div>

//             {/* Footer */}
//             <div className="pt-3 border-t border-neutral-200">
//               <p className="text-xs text-center text-neutral-500">
//                 <i className="bi bi-clock mr-1"></i> Code expires in 5 minutes
//               </p>
//             </div>
//           </div>

//           {/* Close button */}
//           <button
//             type="button"
//             onClick={onClose}
//             className="absolute right-3 top-3 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
//           >
//             <i className="bi bi-x-lg text-sm"></i>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }