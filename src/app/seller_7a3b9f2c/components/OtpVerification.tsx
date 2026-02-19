import React, { useState } from "react";
import VerificationModal from "./OtpModalSixBox";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onVerified: () => void;
  verified: boolean;
   disabled?: boolean;
}

export default function OtpVerification({ label, value, onChange, onVerified, verified, disabled = false }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const formatPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, ""); // remove spaces, +, etc.
  
  if (clean.startsWith("91") && clean.length === 12) {
    return `+${clean}`;
  }

  if (clean.length === 10) {
    return `+91${clean}`;
  }

  return `+${clean}`;
};


const sendOtp = async () => {
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
  
  setIsLoading(true);
  setError(null);
  
  try {
    if (label === "Email") {
      await sellerRegService.sendEmailOtp({ email: value });
    } else {
      // Format phone with +91 prefix
      const phoneWithPrefix = formatPhone(value);
      console.log('📡 Sending SMS OTP to:', { phone: phoneWithPrefix });
      
      const response = await sellerRegService.sendSMSOtp({ 
        phone: phoneWithPrefix
      });
      
      console.log('✅ OTP sent successfully:', response);
    }
    setShowModal(true);
  } catch (err: any) {
    console.error('❌ Failed to send OTP:', err);
    
    // Handle authentication error specifically
    if (err.message && err.message.includes('Authenticate')) {
      setError("Authentication failed. Please check your API configuration or login again.");
    } else if (err.response?.data?.data?.message) {
      setError(err.response.data.data.message);
    } else if (err.message) {
      setError(err.message);
    } else {
      setError(`Failed to send OTP to ${label}. Please try again.`);
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
        // Mobile - Format to E.164 format
        const phoneWithPrefix = `+91${value}`;
        console.log(`📡 Resending SMS OTP to:`, { phone: phoneWithPrefix });
        
        const response = await sellerRegService.sendSMSOtp({ 
          phone: phoneWithPrefix
        });
        
        console.log(`✅ SMS OTP resent successfully:`, response);
      }
    } catch (err: any) {
      console.error(`❌ Failed to resend ${label} OTP:`, err);
      
      let errorMessage = "Failed to resend OTP. Please try again.";
      
      if (err.response) {
        const backendMessage = err.response.data?.message;
        if (backendMessage) {
          errorMessage = backendMessage;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const getIcon = () => {
    if (label === "Email") return "bi-envelope";
    return "bi-phone";
  };

  const getPlaceholder = () => {
    if (label === "Email") return "Enter email address";
    return "Enter 10-digit mobile number";
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
                : disabled
                 ? "bg-error-300 text-white border-2 border-error-300 cursor-not-allowed opacity-60"
                : "bg-white text-primary-700 border-2 border-primary-700 hover:bg-primary-50"
            }`}
            onClick={sendOtp}
            disabled={verified || isLoading || disabled}
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

