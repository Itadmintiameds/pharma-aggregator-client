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
    // Generate a demo OTP for testing
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
      <div className="mb-4 pharma-otp-field">
        <label className="form-label fw-semibold">
          <i className={`bi ${getIcon()} me-2`}></i>{label}
        </label>
        <div className="d-flex gap-2 align-items-start">
          <input
            type={label === "Email" ? "email" : "tel"}
            className={`form-control pharma-input ${verified ? "otp-verified" : ""}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={verified}
            placeholder={getPlaceholder()}
          />
          <button 
            type="button"
            className={`btn ${verified ? 'btn-success' : 'btn-outline-primary'} pharma-otp-btn`}
            onClick={sendOtp}
            disabled={verified}
          >
            {verified ? (
              <>
                <i className="bi bi-check-circle me-1"></i> Verified
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i> Send OTP
              </>
            )}
          </button>
        </div>
        {verified && (
          <small className="pharma-verified-text mt-1 d-block">
            <i className="bi bi-check-circle-fill me-1"></i> {label} verified successfully
          </small>
        )}
      </div>

      <VerificationModal
        show={showModal}
        label={value}
        type={label.toLowerCase() as "email" | "phone"}
        onClose={() => setShowModal(false)}
        onVerified={() => {
          onVerified();
          setShowModal(false);
        }}
      />
    </>
  );
}