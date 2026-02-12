import React, { useState } from "react";
import VerificationModal from "./OtpModalSixBox";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onVerified: () => void;
  verified: boolean;
}

export default function OtpVerification({ label, value, onChange, onVerified, verified }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    if (!value) {
      alert(`Enter ${label} first`);
      return;
    }
    
    // Email validation
    if (label === "Email" && !/\S+@\S+\.\S+/.test(value)) {
      alert("Please enter a valid email address");
      return;
    }
    
    // Mobile validation
    if (label === "Mobile" && !/^\d{10}$/.test(value)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (label === "Email") {
        console.log(`📡 Sending Email OTP to:`, value);
        await sellerRegService.sendEmailOtp({ email: value });
        console.log(`✅ Email OTP sent successfully`);
        setShowModal(true);
      } else {
        // ===== TEMPORARY: SMS Service Bypass for Testing =====
        console.log("⚠️ SMS service is bypassed for testing");
        console.log(`🔧 Test OTP for ${value}: 123456`);
        
        // Store test mode flag and OTP in sessionStorage
        sessionStorage.setItem('sms_test_mode', 'true');
        sessionStorage.setItem('test_otp', '123456');
        sessionStorage.setItem('test_phone', value);
        
        // Show success message with test OTP
        alert(`[TEST MODE] SMS would be sent to ${value}.\n\nUse OTP: 123456`);
        
        setShowModal(true);
        // ===== END OF TEMPORARY BYPASS =====
      }
    } catch (err: any) {
      console.error(`❌ Failed to send ${label} OTP:`, err);
      
      if (err.response?.status === 500) {
        setError(`${label} OTP service is temporarily unavailable. Please try again later.`);
      } else {
        setError(err.response?.data?.message || `Failed to send OTP to ${label}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (label === "Email") {
        console.log(`📡 Resending Email OTP to:`, value);
        await sellerRegService.sendEmailOtp({ email: value });
        console.log(`✅ Email OTP resent successfully`);
      } else {
        // ===== TEMPORARY: SMS Resend Bypass =====
        console.log("⚠️ SMS resend service is bypassed for testing");
        console.log(`🔧 Test OTP for ${value}: 123456`);
        
        // Update test mode data
        sessionStorage.setItem('sms_test_mode', 'true');
        sessionStorage.setItem('test_otp', '123456');
        sessionStorage.setItem('test_phone', value);
        
        alert(`[TEST MODE] SMS would be resent to ${value}.\n\nUse OTP: 123456`);
        // ===== END OF TEMPORARY BYPASS =====
      }
    } catch (err: any) {
      console.error(`❌ Failed to resend ${label} OTP:`, err);
      throw err;
    }
  };

  const getIcon = () => {
    if (label === "Email") return "bi-envelope";
    return "bi-phone";
  };

  const getPlaceholder = () => {
    if (label === "Email") return "Enter email address";
    return "Enter mobile number";
  };

  return (
    <>
      <div className="mb-4">
        <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
          <i className={`bi ${getIcon()}`}></i>
          {label} <span className="text-error-300">*</span>
        </label>

        <div className="flex gap-2 items-center">
          <input
            type={label === "Email" ? "email" : "tel"}
            className={`flex-1 px-4 py-2 border-2 ${
              verified ? "border-success-300 bg-success-50" : "border-primary-200"
            } rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={verified}
            placeholder={getPlaceholder()}
            maxLength={label === "Mobile" ? 10 : undefined}
          />

          <button 
            type="button"
            className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              verified 
                ? "bg-success-300 text-white border-2 border-success-300" 
                : "bg-white text-primary-700 border-2 border-primary-700 hover:bg-primary-50"
            }`}
            onClick={sendOtp}
            disabled={verified || isLoading}
          >
            {isLoading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin"></i> Sending...
              </>
            ) : verified ? (
              <>
                <i className="bi bi-check-circle"></i> Verified
              </>
            ) : (
              <>
                <i className="bi bi-send"></i> Send OTP
              </>
            )}
          </button>
        </div>

        {verified && (
          <p className="mt-2 text-sm text-success-300">
            <i className="bi bi-check-circle-fill mr-1"></i> {label} verified successfully
          </p>
        )}
        
        {error && !verified && (
          <p className="mt-2 text-sm text-error-300 flex items-center">
            <i className="bi bi-exclamation-circle mr-1"></i>
            {error}
          </p>
        )}
        
        {/* Show test mode indicator for mobile */}
        {label === "Mobile" && !verified && !error && (
          <p className="mt-2 text-xs text-warning-600 flex items-center">
            <i className="bi bi-tools mr-1"></i>
            TEST MODE: Use OTP 123456
          </p>
        )}
      </div>

      <VerificationModal
        show={showModal}
        label={value}
        type={label === "Email" ? "email" : "phone"}
        onClose={() => setShowModal(false)}
        onVerified={onVerified}
        onResend={handleResend}
      />
    </>
  );
}












// original code without the implementation of backend code...............

// import React, { useState } from "react";
// import VerificationModal from "./OtpModalSixBox";

// interface Props {
//   label: string;
//   value: string;
//   onChange: (val: string) => void;
//   onVerified: () => void;
//   verified: boolean;
// }

// export default function OtpVerification({ label, value, onChange, onVerified, verified }: Props) {
//   const [showModal, setShowModal] = useState(false);
//   const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);

//   const sendOtp = () => {
//     if (!value) {
//       alert(`Enter ${label} first`);
//       return;
//     }
    
//     if (label === "Email" && !/\S+@\S+\.\S+/.test(value)) {
//       alert("Please enter a valid email address");
//       return;
//     }
    
//     if (label === "Mobile" && !/^\d{10}$/.test(value)) {
//       alert("Please enter a valid 10-digit mobile number");
//       return;
//     }
    
//     setShowModal(true);
//     const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     setLastSentOtp(demoOtp);
    
//     console.log(`Demo OTP for ${label} (${value}): ${demoOtp}`);
//     alert(`Demo: OTP sent to ${label}. Use code: ${demoOtp} for verification.`);
//   };

//   const getIcon = () => {
//     if (label === "Email") return "bi-envelope";
//     return "bi-phone";
//   };

//   const getPlaceholder = () => {
//     if (label === "Email") return "Enter email address";
//     return "Enter mobile number";
//   };

//   return (
//     <>
//       <div className="mb-4">
//         <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//           <i className={`bi ${getIcon()}`}></i>
//           {label} <span className="text-error-300">*</span>
//         </label>

//         <div className="flex gap-2 items-center">
//           <input
//             type={label === "Email" ? "email" : "tel"}
//             className={`flex-1 px-4 py-2 border-2 ${
//               verified ? "border-success-300 bg-success-50" : "border-primary-200"
//             } rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all`}
//             value={value}
//             onChange={(e) => onChange(e.target.value)}
//             disabled={verified}
//             placeholder={getPlaceholder()}
//           />

//           <button 
//             type="button"
//             className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
//               verified 
//                 ? "bg-success-300 text-white border-2 border-success-300" 
//                 : "bg-white text-primary-700 border-2 border-primary-700 hover:bg-primary-50"
//             }`}
//             onClick={sendOtp}
//             disabled={verified}
//           >
//             {verified ? (
//               <>
//                 <i className="bi bi-check-circle"></i> Verified
//               </>
//             ) : (
//               <>
//                 <i className="bi bi-send"></i> Send OTP
//               </>
//             )}
//           </button>
//         </div>

//         {verified && (
//           <p className="mt-2 text-sm text-success-300">
//             <i className="bi bi-check-circle-fill mr-1"></i> {label} verified successfully
//           </p>
//         )}
//       </div>

//       <VerificationModal
//         show={showModal}
//         label={value}
//         type={label === "Email" ? "email" : "phone"}
//         onClose={() => setShowModal(false)}
//         onVerified={() => {
//           onVerified();
//           setShowModal(false);
//         }}
//         expectedOtp={lastSentOtp}
//         onResend={() => {
//           const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
//           setLastSentOtp(newOtp);
//           console.log(`New OTP sent: ${newOtp}`);
//           alert(`New OTP sent: ${newOtp}`);
//         }}
//       />
//     </>
//   );
// }