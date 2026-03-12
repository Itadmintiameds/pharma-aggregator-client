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
  const [animateType, setAnimateType] = useState<"enter" | "switch">("enter");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null); // Add ref for modal content

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

  //  click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (show && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose(); // Call onClose when clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  //escape key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (show && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [show, onClose]);

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

  const prevType = useRef(type);

useEffect(() => {
  if (prevType.current !== type) {
    setAnimateType("switch");
  } else {
    setAnimateType("enter");
  }

  prevType.current = type;
}, [type]);

useEffect(() => {
  setOtp(["", "", "", "", "", ""]);

  setTimeout(() => {
    inputs.current[0]?.focus();
  }, 50);
}, [type]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose} // Add onClick to backdrop
    >
      {/* Modal content - stop propagation to prevent closing when clicking inside */}
      <div 
        ref={modalRef}
        className="w-90 bg-white rounded-xl shadow-lg p-8 text-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div
          className={`${
            animateType === "switch" ? "animate-contentSwitch" : "animate-contentEnter"
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md
              ${type === "email" ? "bg-purple-200" : "bg-red-200"}`}
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
          <h2 className="text-2xl font-semibold text-neutral-900 mb-1">
            {type === "email" ? "Verify your email" : "Verify your mobile number"}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-neutral-600 mb-4">
            We just sent you a verification code to your{" "}
            {type === "email" ? "email id" : "phone number"}
          </p>

          {/* OTP Label */}
          <p className="text-xl font-medium text-neutral-800 mb-4">
            Enter your OTP code here
          </p>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 mb-6">
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
                className="w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 mb-4">
              {error}
            </p>
          )}

          {/* Verify Button */}
          <button
            onClick={verify}
            disabled={isVerifying || otp.join("").length !== 6}
            className="w-37.5 h-12 py-3 rounded-md bg-primary-900 text-white font-medium transition"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>

          {/* Resend */}
          <div className="mt-5 text-xl">
            <p className="text-neutral-800">Didn&apos;t receive the OTP?</p>

            <button
              onClick={handleResendCode}
              disabled={!canResend}
              className="text-warning-500 font-large mt-1 hover:underline disabled:text-neutral-400"
            >
              {canResend ? "Resend OTP" : `Resend in ${resendCountdown}s`}
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes contentEnter {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes contentSwitch {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-contentEnter {
          animation: contentEnter 0.35s ease-out;
        }

        .animate-contentSwitch {
          animation: contentSwitch 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}









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
//   // onClose, 
//   onVerified, 
//   type, 
//   onResend 
// }: Props) {
//   const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [canResend, setCanResend] = useState(true);
//   const [resendCountdown, setResendCountdown] = useState(0);
//   const [error, setError] = useState<string>("");
//   const [animateType, setAnimateType] = useState<"enter" | "switch">("enter");
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

//   const handleChange = (value: string, index: number) => {
//     if (!/^\d?$/.test(value)) return;
    
//     // Create new OTP array with the updated value
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError("");
    
//     // Auto-focus next input
//     if (value && index < 5) {
//       inputs.current[index + 1]?.focus();
//     }
    
//     // Auto-verify when 6th digit is entered
//     if (value && index === 5) {
//       // Use newOtp instead of otp state
//       const enteredOtp = newOtp.join("");
//       if (enteredOtp.length === 6) {
//         // Add a small delay to ensure UI updates
//         setTimeout(async () => {
//           setIsVerifying(true);
//           try {
//             if (type === "email") {
//               await sellerRegService.verifyEmailOtp({
//                 email: label,
//                 otp: enteredOtp
//               });
//             } else {
//               const phoneWithPrefix = formatPhone(label);
//               console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
              
//               const response = await sellerRegService.verifySMSOtp({
//                 phone: phoneWithPrefix,
//                 otp: enteredOtp
//               });
              
//               console.log('✅ OTP verified:', response);
//             }
//             onVerified();
//             // onClose();
//           // eslint-disable-next-line @typescript-eslint/no-explicit-any
//           } catch (error: any) {
//             console.error('❌ Verification failed:', error);
            
//             if (error.message && error.message.includes('Authenticate')) {
//               setError("Authentication failed. Please check your API configuration.");
//             } else if (error.message) {
//               setError(error.message);
//             } else {
//               setError("Invalid OTP. Please try again.");
//             }
            
//             setOtp(["", "", "", "", "", ""]);
//           } finally {
//             setIsVerifying(false);
//           }
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
//     const pasteData = e.clipboardData.getData('text').trim();
    
//     if (/^\d{6}$/.test(pasteData)) {
//       const newOtp = pasteData.split('');
//       setOtp(newOtp as string[]);
//       setError("");
      
//       // Auto-verify after paste
//       setTimeout(async () => {
//         setIsVerifying(true);
//         try {
//           if (type === "email") {
//             await sellerRegService.verifyEmailOtp({
//               email: label,
//               otp: pasteData
//             });
//           } else {
//             const phoneWithPrefix = formatPhone(label);
//             await sellerRegService.verifySMSOtp({
//               phone: phoneWithPrefix,
//               otp: pasteData
//             });
//           }
//           onVerified();
//           // onClose();
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         } catch (error: any) {
//           setError(error.message || "Invalid OTP. Please try again.");
//           setOtp(["", "", "", "", "", ""]);
//         } finally {
//           setIsVerifying(false);
//         }
//       }, 50);
      
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
    
//     setIsVerifying(true);
//     setError("");
    
//     try {
//       if (type === "email") {
//         await sellerRegService.verifyEmailOtp({
//           email: label,
//           otp: enteredOtp
//         });
//       } else {
//         const phoneWithPrefix = formatPhone(label);
//         console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
        
//         const response = await sellerRegService.verifySMSOtp({
//           phone: phoneWithPrefix,
//           otp: enteredOtp
//         });
        
//         console.log('✅ OTP verified:', response);
//       }
      
//       onVerified();
//       // onClose();
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error('❌ Verification failed:', error);
      
//       if (error.message && error.message.includes('Authenticate')) {
//         setError("Authentication failed. Please check your API configuration.");
//       } else if (error.message) {
//         setError(error.message);
//       } else {
//         setError("Invalid OTP. Please try again.");
//       }
      
//       setOtp(["", "", "", "", "", ""]);
//     } finally {
//       setIsVerifying(false);
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
//       await onResend();
//       console.log(`✅ ${type} OTP resent successfully`);
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error(`❌ Failed to resend ${type} OTP:`, error);
      
//       let errorMessage = "Failed to resend code. Please try again.";
      
//       if (error.response) {
//         const backendMessage = error.response.data?.message;
//         if (backendMessage) {
//           errorMessage = backendMessage;
//         }
//       }
      
//       setError(errorMessage);
//     }
    
//     setTimeout(() => {
//       inputs.current[0]?.focus();
//     }, 50);
//   };

//   const prevType = useRef(type);

// useEffect(() => {
//   if (prevType.current !== type) {
//     setAnimateType("switch");
//   } else {
//     setAnimateType("enter");
//   }

//   prevType.current = type;
// }, [type]);

// useEffect(() => {
//   setOtp(["", "", "", "", "", ""]);

//   setTimeout(() => {
//     inputs.current[0]?.focus();
//   }, 50);
// }, [type]);


//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//   {/* <div className="w-[360px] bg-white rounded-xl shadow-lg p-8 text-center"> */}

//  <div className="w-90 bg-white rounded-xl shadow-lg p-8 text-center">

//   <div
//     className={`${
//       animateType === "switch" ? "animate-contentSwitch" : "animate-contentEnter"
//     }`}
//   >

//   {/* <div
//   className={`w-90 bg-white rounded-xl shadow-lg p-8 text-center 
//   ${animateType === "switch" ? "animate-modalSwitch" : "animate-modalEnter"}`}
// > */}

//     {/* Icon */}
//     <div className="flex justify-center mb-4">
//   <div
//     className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md
//     ${type === "email" ? "bg-purple-200" : "bg-red-200"}`}
//   >
//     {type === "email" ? (
//       <Image
//         src="/icons/emailVerIcon.png"
//         alt="Email Icon"
//         width={85}
//         height={40}
//         className="object-contain"
//       />
//     ) : (
//       <Image
//         src="/icons/mobVerIcon.png"
//         alt="Mobile Icon"
//         width={85}
//         height={40}
//         className="object-contain"
//       />
//     )}
//   </div>
// </div>

//     {/* Title */}
//     <h2 className="text-2xl font-semibold text-neutral-900 mb-1">
//       {type === "email" ? "Verify your email" : "Verify your mobile number"}
//     </h2>

//     {/* Subtitle */}
//     <p className="text-sm text-neutral-600 mb-4">
//       We just sent you a verification code to your{" "}
//       {type === "email" ? "email id" : "phone number"}
//     </p>

//     {/* OTP Label */}
//     <p className="text-xl font-medium text-neutral-800 mb-4">
//       Enter your OTP code here
//     </p>

//     {/* OTP Inputs */}
//     <div className="flex justify-center gap-2 mb-6">
//       {otp.map((digit, index) => (
//         <input
//           key={index}
//           ref={(el) => {
//             inputs.current[index] = el;
//           }}
//           type="text"
//           maxLength={1}
//           value={digit}
//           onChange={(e) => handleChange(e.target.value, index)}
//           onKeyDown={(e) => handleKeyDown(e, index)}
//           onPaste={handlePaste}
//           className="w-12 h-12 bg-neutral-100 text-center text-lg font-semibold border  border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
//         />
//       ))}
//     </div>

//     {/* Verify Button */}
//     <button
//       onClick={verify}
//       disabled={isVerifying || otp.join("").length !== 6}
//       className="w-37.5 h-12 py-3 rounded-md bg-primary-900 text-white font-medium transition"
//     >
//       {isVerifying ? "Verifying..." : "Verify"}
//     </button>

//     {/* Resend */}
//     <div className="mt-5 text-xl">
//       <p className="text-neutral-800">Didn&apos;t receive the OTP?</p>

//       <button
//         onClick={handleResendCode}
//         disabled={!canResend}
//         className="text-warning-500  font-large mt-1 hover:underline disabled:text-neutral-400"
//       >
//         {canResend ? "Resend OTP" : `Resend in ${resendCountdown}s`}
//       </button>
//     </div>
//   </div>
//   <style jsx>{`
// @keyframes contentEnter {
//   0% {
//     opacity: 0;
//     transform: translateY(30px);
//   }
//   100% {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// @keyframes contentSwitch {
//   0% {
//     opacity: 0;
//     transform: translateY(50px);
//   }
//   60% {
//     opacity: 0.8;
//     transform: translateY(-6px);
//   }
//   100% {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .animate-contentEnter {
//   animation: contentEnter 0.35s ease-out;
// }

// .animate-contentSwitch {
//   animation: contentSwitch 0.9s cubic-bezier(0.22, 1, 0.36, 1);
// }
// `}</style>
// </div>
// </div>

//   );
// }


















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

//   const handleChange = (value: string, index: number) => {
//     if (!/^\d?$/.test(value)) return;
    
//     // Create new OTP array with the updated value
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError("");
    
//     // Auto-focus next input
//     if (value && index < 5) {
//       inputs.current[index + 1]?.focus();
//     }
    
//     // Auto-verify when 6th digit is entered
//     if (value && index === 5) {
//       // Use newOtp instead of otp state
//       const enteredOtp = newOtp.join("");
//       if (enteredOtp.length === 6) {
//         // Add a small delay to ensure UI updates
//         setTimeout(async () => {
//           setIsVerifying(true);
//           try {
//             if (type === "email") {
//               await sellerRegService.verifyEmailOtp({
//                 email: label,
//                 otp: enteredOtp
//               });
//             } else {
//               const phoneWithPrefix = formatPhone(label);
//               console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
              
//               const response = await sellerRegService.verifySMSOtp({
//                 phone: phoneWithPrefix,
//                 otp: enteredOtp
//               });
              
//               console.log('✅ OTP verified:', response);
//             }
//             onVerified();
//             onClose();
//           // eslint-disable-next-line @typescript-eslint/no-explicit-any
//           } catch (error: any) {
//             console.error('❌ Verification failed:', error);
            
//             if (error.message && error.message.includes('Authenticate')) {
//               setError("Authentication failed. Please check your API configuration.");
//             } else if (error.message) {
//               setError(error.message);
//             } else {
//               setError("Invalid OTP. Please try again.");
//             }
            
//             setOtp(["", "", "", "", "", ""]);
//           } finally {
//             setIsVerifying(false);
//           }
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
//     const pasteData = e.clipboardData.getData('text').trim();
    
//     if (/^\d{6}$/.test(pasteData)) {
//       const newOtp = pasteData.split('');
//       setOtp(newOtp as string[]);
//       setError("");
      
//       // Auto-verify after paste
//       setTimeout(async () => {
//         setIsVerifying(true);
//         try {
//           if (type === "email") {
//             await sellerRegService.verifyEmailOtp({
//               email: label,
//               otp: pasteData
//             });
//           } else {
//             const phoneWithPrefix = formatPhone(label);
//             await sellerRegService.verifySMSOtp({
//               phone: phoneWithPrefix,
//               otp: pasteData
//             });
//           }
//           onVerified();
//           onClose();
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         } catch (error: any) {
//           setError(error.message || "Invalid OTP. Please try again.");
//           setOtp(["", "", "", "", "", ""]);
//         } finally {
//           setIsVerifying(false);
//         }
//       }, 50);
      
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
    
//     setIsVerifying(true);
//     setError("");
    
//     try {
//       if (type === "email") {
//         await sellerRegService.verifyEmailOtp({
//           email: label,
//           otp: enteredOtp
//         });
//       } else {
//         const phoneWithPrefix = formatPhone(label);
//         console.log('📡 Verifying OTP:', { phone: phoneWithPrefix, otp: enteredOtp });
        
//         const response = await sellerRegService.verifySMSOtp({
//           phone: phoneWithPrefix,
//           otp: enteredOtp
//         });
        
//         console.log('✅ OTP verified:', response);
//       }
      
//       onVerified();
//       onClose();
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error('❌ Verification failed:', error);
      
//       if (error.message && error.message.includes('Authenticate')) {
//         setError("Authentication failed. Please check your API configuration.");
//       } else if (error.message) {
//         setError(error.message);
//       } else {
//         setError("Invalid OTP. Please try again.");
//       }
      
//       setOtp(["", "", "", "", "", ""]);
//     } finally {
//       setIsVerifying(false);
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
//       await onResend();
//       console.log(`✅ ${type} OTP resent successfully`);
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error(`❌ Failed to resend ${type} OTP:`, error);
      
//       let errorMessage = "Failed to resend code. Please try again.";
      
//       if (error.response) {
//         const backendMessage = error.response.data?.message;
//         if (backendMessage) {
//           errorMessage = backendMessage;
//         }
//       }
      
//       setError(errorMessage);
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
//   // const primaryBorder = type === "email" ? "primary-200" : "success-200";

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