import React, { useState } from "react";
import VerificationModal from "./OtpModalSixBox";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onVerified: () => void;
  verified: boolean;
}

export default function OtpVerification({ label, value, onChange, onVerified, verified }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);

  const sendOtp = () => {
    if (!value) {
      alert(`Enter ${label} first`);
      return;
    }
    
    if (label === "Email" && !/\S+@\S+\.\S+/.test(value)) {
      alert("Please enter a valid email address");
      return;
    }
    
    if (label === "Mobile" && !/^\d{10}$/.test(value)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setShowModal(true);
    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setLastSentOtp(demoOtp);
    
    console.log(`Demo OTP for ${label} (${value}): ${demoOtp}`);
    alert(`Demo: OTP sent to ${label}. Use code: ${demoOtp} for verification.`);
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
          />

          <button 
            type="button"
            className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              verified 
                ? "bg-success-300 text-white border-2 border-success-300" 
                : "bg-white text-primary-700 border-2 border-primary-700 hover:bg-primary-50"
            }`}
            onClick={sendOtp}
            disabled={verified}
          >
            {verified ? (
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
      </div>

      <VerificationModal
        show={showModal}
        label={value}
        type={label === "Email" ? "email" : "phone"}
        onClose={() => setShowModal(false)}
        onVerified={() => {
          onVerified();
          setShowModal(false);
        }}
        expectedOtp={lastSentOtp}
        onResend={() => {
          const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
          setLastSentOtp(newOtp);
          console.log(`New OTP sent: ${newOtp}`);
          alert(`New OTP sent: ${newOtp}`);
        }}
      />
    </>
  );
}












// old code without global css....................
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
//       <div className="phsr-otp-field">
//         <label className="phsr-form-label fw-semibold">
//           <i className={`bi ${getIcon()} me-2`}></i>{label}
//         </label>

//         <div className="d-flex gap-2 align-items-center phsr-otp-row">
//           <input
//             type={label === "Email" ? "email" : "tel"}
//             className={`phsr-input phsr-otp-input ${verified ? "phsr-otp-verified" : ""}`}
//             value={value}
//             onChange={(e) => onChange(e.target.value)}
//             disabled={verified}
//             placeholder={getPlaceholder()}
//           />

//           <button 
//             type="button"
//             className={`phsr-otp-btn ${verified ? 'btn-success' : 'btn-outline-primary'}`}
//             onClick={sendOtp}
//             disabled={verified}
//           >
//             {verified ? (
//               <>
//                 <i className="bi bi-check-circle me-1"></i> Verified
//               </>
//             ) : (
//               <>
//                 <i className="bi bi-send me-1"></i> Send OTP
//               </>
//             )}
//           </button>
//         </div>

//         {verified && (
//           <small className="phsr-verified-text phsr-mt-1 d-block">
//             <i className="bi bi-check-circle-fill me-1"></i> {label} verified successfully
//           </small>
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
