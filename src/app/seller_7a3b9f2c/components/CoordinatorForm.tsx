"use client"; 

import React, { useState } from "react";
import { Briefcase, Phone, Mail, ChevronDown } from "lucide-react";
import VerificationModal from "./OtpModalSixBox";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { HiOutlineUserGroup } from "react-icons/hi2";

interface Props {
  formData: any;
  isCheckingEmail: boolean;
  isCheckingPhone: boolean;
  emailExistsError: string;
  phoneExistsError: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onEmailVerified: () => void;
  onPhoneVerified: () => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  prevStep: () => void;
  nextStep: () => void;
}

// Country codes data
const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
];

export default function CoordinatorForm({
  formData,
  isCheckingEmail,
  isCheckingPhone,
  emailExistsError,
  phoneExistsError,
  emailVerified,
  phoneVerified,
  onEmailChange,
  onPhoneChange,
  onEmailVerified,
  onPhoneVerified,
  onAlphabetInput,
  prevStep,
  nextStep,
}: Props) {

  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Validate for Indian numbers
    if (selectedCountryCode === "+91") {
      // Check if first digit is valid (6-9) when typing first character
      if (value.length === 1 && !/^[6-9]$/.test(value)) {
        return;
      }
      // Limit to 10 digits
      if (value.length <= 10) {
        // Set error if number exists but is invalid
        if (value.length === 10 && !/^[6-9]\d{9}$/.test(value)) {
          setPhoneError("Indian mobile number must start with 6, 7, 8, or 9");
        } else {
          setPhoneError("");
        }
        onPhoneChange(value);
      }
    } else {
      // For other countries, allow up to 15 digits
      if (value.length <= 15) {
        setPhoneError("");
        onPhoneChange(value);
      }
    }
  };

  // Handle key down to prevent invalid first digit for India
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedCountryCode === "+91") {
      const currentValue = formData.coordinatorMobile || "";
      // If no digits entered yet, prevent keys 0-5
      if (currentValue.length === 0) {
        const key = e.key;
        if (/^[0-5]$/.test(key)) {
          e.preventDefault();
        }
      }
    }
  };

  // Handle paste to clean invalid numbers
  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let cleanedText = pastedText.replace(/\D/g, '');
    
    if (selectedCountryCode === "+91") {
      // For India, ensure first digit is 6-9 and length is 10
      if (cleanedText.length > 0) {
        if (!/^[6-9]/.test(cleanedText)) {
          cleanedText = '';
        } else {
          cleanedText = cleanedText.substring(0, 10);
        }
      }
      if (cleanedText.length === 10 && !/^[6-9]\d{9}$/.test(cleanedText)) {
        setPhoneError("Indian mobile number must start with 6, 7, 8, or 9");
      } else {
        setPhoneError("");
      }
    } else {
      cleanedText = cleanedText.substring(0, 15);
      setPhoneError("");
    }
    
    onPhoneChange(cleanedText);
  };

  // Send OTP for Email
  const handleSendEmailOTP = async () => {
    if (!formData.coordinatorEmail) {
      toast.error("Please enter email address");
      return;
    }

    if (emailExistsError) {
      toast.error(emailExistsError);
      return;
    }

    if (isCheckingEmail) {
      toast.info("Please wait while we check email availability");
      return;
    }

    try {
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      setVerificationType("email");
      setShowModal(true);
    } catch (err: any) {
      console.error('❌ Failed to send email OTP:', err);
      toast.error(err.message || "Failed to send OTP. Please try again.");
    }
  };

  // Send OTP for Phone
  const handleSendPhoneOTP = async () => {
    if (!formData.coordinatorMobile) {
      toast.error("Please enter mobile number");
      return;
    }

    // Validate based on selected country code
    if (selectedCountryCode === "+91") {
      if (formData.coordinatorMobile.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
      if (!/^[6-9]/.test(formData.coordinatorMobile)) {
        toast.error("Indian mobile number must start with 6, 7, 8, or 9");
        return;
      }
    } else {
      if (formData.coordinatorMobile.length < 5 || formData.coordinatorMobile.length > 15) {
        toast.error(`Please enter a valid mobile number (${selectedCountryCode}XXXXXXXXX)`);
        return;
      }
    }

    if (phoneExistsError) {
      toast.error(phoneExistsError);
      return;
    }

    if (isCheckingPhone) {
      toast.info("Please wait while we check phone availability");
      return;
    }

    try {
      const phoneWithPrefix = `${selectedCountryCode}${formData.coordinatorMobile}`;
//      await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
      setVerificationType("phone");
      setShowModal(true);
    } catch (err: any) {
      console.error('❌ Failed to send phone OTP:', err);
      toast.error(err.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleEmailVerified = () => {
    setShowModal(false);
    onEmailVerified();
    toast.success("Email verified successfully!");
  };

  const handlePhoneVerified = () => {
    setShowModal(false);
    onPhoneVerified();
    toast.success("Phone number verified successfully!");
  };

  const handleResendEmail = async () => {
    try {
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleResendPhone = async () => {
    try {
      const phoneWithPrefix = `${selectedCountryCode}${formData.coordinatorMobile}`;
   //   await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleContinue = () => {
    // Check mandatory fields with toast errors
    if (!formData.coordinatorName?.trim()) {
      toast.error("Coordinator name is required");
      return;
    }

    if (!formData.coordinatorDesignation?.trim()) {
      toast.error("Coordinator designation is required");
      return;
    }

    if (!formData.coordinatorEmail) {
      toast.error("Coordinator email is required");
      return;
    }

    if (!formData.coordinatorMobile) {
      toast.error("Coordinator mobile number is required");
      return;
    }

    // Validate based on selected country code
    if (selectedCountryCode === "+91") {
      if (formData.coordinatorMobile.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
      if (!/^[6-9]/.test(formData.coordinatorMobile)) {
        toast.error("Indian mobile number must start with 6, 7, 8, or 9");
        return;
      }
    } else {
      if (formData.coordinatorMobile.length < 5 || formData.coordinatorMobile.length > 15) {
        toast.error(`Please enter a valid mobile number (${selectedCountryCode}XXXXXXXXX)`);
        return;
      }
    }

    if (emailExistsError) {
      toast.error(emailExistsError);
      return;
    }

    if (phoneExistsError) {
      toast.error(phoneExistsError);
      return;
    }

    // Check if both email and phone are verified
    if (!emailVerified || !phoneVerified) {
      toast.error("Please verify both Mobile & Email ID.");
      return;
    }

    // All good, proceed to next step
    nextStep();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Section */}
      <div>
        <div className="text-h2 font-semibold">Coordinator contact details</div>
        <div className="text-label-l3 text-neutral-600 mt-1">
          Coordinator details for communication and verification
        </div>
      </div>

      {/* Coordinator Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
          {/* Coordinator Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="coordinatorName"
                value={formData.coordinatorName}
                onChange={(e) => onAlphabetInput(e, "coordinatorName")}
                placeholder="Enter coordinator name"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* Coordinator Designation */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Designation
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="coordinatorDesignation"
                value={formData.coordinatorDesignation}
                onChange={(e) => onAlphabetInput(e, "coordinatorDesignation")}
                placeholder="Enter designation"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Mobile Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
                <div className="flex">
                  {/* Country Code Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="h-12 px-2 pl-10 pr-2 rounded-l-2xl border border-r-0 border-neutral-500 bg-white flex items-center gap-1 focus:outline-none hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium">{selectedCountryCode}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <button
                              key={country.code}
                              onClick={() => {
                                setSelectedCountryCode(country.code);
                                setPhoneError("");
                                // Clear the phone value when changing country
                                onPhoneChange("");
                                setIsDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-sm font-semibold">{country.code}</span>
                              <span className="text-xs text-neutral-500">{country.country}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    name="coordinatorMobile"
                    value={formData.coordinatorMobile}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={handlePhonePaste}
                    placeholder={selectedCountryCode === "+91" ? "Enter 10-digit mobile number (starts with 6,7,8,9)" : "Enter mobile number"}
                    maxLength={selectedCountryCode === "+91" ? 10 : 15}
                    className={`flex-1 h-12 px-4 pr-4 rounded-r-2xl border focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 ${
                      phoneError ? 'border-red-500' : 'border-neutral-500'
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-red-500 flex items-start">
                    <span className="mr-1">⚠️</span>
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleSendPhoneOTP}
                className="h-12 px-4 rounded-lg border text-white font-semibold whitespace-nowrap bg-[#9F75FC]"
              >
                {phoneVerified ? "OTP Verified" : "Send OTP"}
              </button>
            </div>
            {isCheckingPhone && (
              <p className="mt-1 text-xs text-[#4B0082] flex items-center">
                <span className="animate-spin mr-1">⏳</span>
                Checking phone availability...
              </p>
            )}
            {phoneExistsError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{phoneExistsError}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Email ID
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="email"
                  name="coordinatorEmail"
                  value={formData.coordinatorEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter email address"
                  className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
                />
              </div>
              <button
                onClick={handleSendEmailOTP}
                className="h-12 px-4 rounded-lg border text-white font-semibold whitespace-nowrap bg-[#9F75FC]"
              >
                {emailVerified ? "OTP Verified" : "Send OTP"}
              </button>
            </div>
            {isCheckingEmail && (
              <p className="mt-1 text-xs text-[#4B0082] flex items-center">
                <span className="animate-spin mr-1">⏳</span>
                Checking email availability...
              </p>
            )}
            {emailExistsError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{emailExistsError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={18}
              height={18}
            />
            Back
          </button>

          <button
            onClick={handleContinue}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold"
          >
            Continue
            <Image
              src="/icons/continueicon.png"
              alt="Continue"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        show={showModal}
        label={
          verificationType === "email"
            ? formData.coordinatorEmail
            : `${selectedCountryCode}${formData.coordinatorMobile}`
        }
        type={verificationType}
        onClose={() => setShowModal(false)}
        onVerified={
          verificationType === "email"
            ? handleEmailVerified
            : handlePhoneVerified
        }
        onResend={
          verificationType === "email"
            ? handleResendEmail
            : handleResendPhone
        }
      />
    </div>
  );
}











// old code without send otp button ..............

// "use client"; 

// import React, { useState } from "react";
// import { Briefcase, Phone, Mail } from "lucide-react";
// import VerificationModal from "./OtpModalSixBox";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";
// import { HiOutlineUserGroup } from "react-icons/hi2";

// interface Props {
//   formData: any;
//   isCheckingEmail: boolean;
//   isCheckingPhone: boolean;
//   emailExistsError: string;
//   phoneExistsError: string;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEmailChange: (email: string) => void;
//   onPhoneChange: (phone: string) => void;
//   onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   prevStep: () => void;
//   onOTPSuccess: () => void;
// }

// export default function CoordinatorForm({
//   formData,
//   isCheckingEmail,
//   isCheckingPhone,
//   emailExistsError,
//   phoneExistsError,
//   emailVerified,
//   phoneVerified,
//   onEmailChange,
//   onPhoneChange,
//   onAlphabetInput,
//   prevStep,
//   onOTPSuccess,
// }: Props) {

//   const router = useRouter();

//   const [showModal, setShowModal] = useState(false)
//   const [verificationType, setVerificationType] = useState<"email" | "phone">("email")
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onEmailChange(e.target.value);
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onPhoneChange(e.target.value);
//   };

//   const handleContinue = async () => {
//     // Check if both email and phone are already verified
//     if (emailVerified && phoneVerified) {
//       // If already verified, just proceed to next step
//       onOTPSuccess();
//       return;
//     }

//     // Check mandatory fields with toast errors
//     if (!formData.coordinatorName?.trim()) {
//       toast.error("Coordinator name is required");
//       return;
//     }

//     if (!formData.coordinatorDesignation?.trim()) {
//       toast.error("Coordinator designation is required");
//       return;
//     }

//     // Check if email has error or is being checked
//     if (emailExistsError) {
//       toast.error(emailExistsError);
//       return;
//     }

//     if (phoneExistsError) {
//       toast.error(phoneExistsError);
//       return;
//     }

//     if (isCheckingEmail || isCheckingPhone) {
//       toast.info("Please wait while we check availability");
//       return;
//     }

//     // Validate email and phone are filled
//     if (!formData.coordinatorEmail) {
//       toast.error("Coordinator email is required");
//       return;
//     }

//     if (!formData.coordinatorMobile) {
//       toast.error("Coordinator mobile number is required");
//       return;
//     }

//     if (formData.coordinatorMobile.length !== 10) {
//       toast.error("Please enter a valid 10-digit mobile number");
//       return;
//     }

//     try {
//       // Determine which verification is needed
//       if (!emailVerified && !phoneVerified) {
//         // Neither is verified, start with email
//         await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
//         setVerificationType("email");
//         setShowModal(true);
//       } else if (!emailVerified && phoneVerified) {
//         // Only phone is verified, verify email
//         await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
//         setVerificationType("email");
//         setShowModal(true);
//       } else if (emailVerified && !phoneVerified) {
//         // Only email is verified, verify phone
//         const phoneWithPrefix = `+91${formData.coordinatorMobile}`;
//         await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
//         setVerificationType("phone");
//         setShowModal(true);
//       }
//     } catch (err: any) {
//       console.error('❌ Failed to send OTP:', err);
//       toast.error("Failed to send OTP. Please try again.");
//     }
//   };

//   const handleEmailVerified = async () => {
//     setIsTransitioning(true)

//     const phoneWithPrefix = `+91${formData.coordinatorMobile}`
//     await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix })

//     // change modal content instead of closing
//     setVerificationType("phone")

//     setTimeout(() => {
//       setIsTransitioning(false)
//     }, 400)
//   }

//   const handlePhoneVerified = () => {
//     setShowModal(false)
//     onOTPSuccess()
//   }

//   const handleResendEmail = async () => {
//     try {
//       await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
//       toast.success("OTP resent successfully");
//     } catch (err) {
//       toast.error("Failed to resend OTP");
//     }
//   };

//   const handleResendPhone = async () => {
//     try {
//       const phoneWithPrefix = `+91${formData.coordinatorMobile}`;
//       await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
//       toast.success("OTP resent successfully");
//     } catch (err) {
//       toast.error("Failed to resend OTP");
//     }
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Coordinator contact details</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Coordinator details for communication and verification
//         </div>
//       </div>

//       {/* Coordinator Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* Coordinator Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorName"
//                 value={formData.coordinatorName}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorName")}
//                 placeholder="Enter coordinator name"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Coordinator Designation */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Designation
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorDesignation"
//                 value={formData.coordinatorDesignation}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorDesignation")}
//                 placeholder="Enter designation"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Mobile Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Mobile Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="tel"
//                 name="coordinatorMobile"
//                 value={formData.coordinatorMobile}
//                 onChange={handlePhoneChange}
//                 placeholder="Enter 10-digit mobile number"
//                 maxLength={10}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//             {isCheckingPhone && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking phone availability...
//               </p>
//             )}
//             {phoneExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{phoneExistsError}</span>
//               </p>
//             )}
//           </div>

//           {/* Email */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Email ID
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="email"
//                 name="coordinatorEmail"
//                 value={formData.coordinatorEmail}
//                 onChange={handleEmailChange}
//                 placeholder="Enter email address"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//             {isCheckingEmail && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking email availability...
//               </p>
//             )}
//             {emailExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{emailExistsError}</span>
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-between mt-10">
//         <div className="flex gap-4">
//           <button
//             onClick={() => router.push("/")}
//             className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
//           >
//             Cancel
//           </button>

//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={prevStep}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold"
//           >
//             <Image
//               src="/icons/backbuttonicon.png"
//               alt="Back"
//               width={18}
//               height={18}
//             />
//             Back
//           </button>

//           <button
//             onClick={handleContinue}
//             disabled={!!emailExistsError || !!phoneExistsError || isCheckingEmail || isCheckingPhone}
//             className={`flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 transition ${
//               emailExistsError || phoneExistsError || isCheckingEmail || isCheckingPhone
//                 ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
//                 : 'border-primary-900 text-primary-900 font-semibold'
//             }`}
//           >
//             Continue
//             <Image
//               src="/icons/continueicon.png"
//               alt="Continue"
//               width={20}
//               height={20}
//             />
//           </button>
//         </div>
//       </div>

//       {/* Verification Modal */}
//       <VerificationModal
//         show={showModal}
//         label={
//           verificationType === "email"
//             ? formData.coordinatorEmail
//             : formData.coordinatorMobile
//         }
//         type={verificationType}
//         onClose={() => setShowModal(false)}
//         onVerified={
//           verificationType === "email"
//             ? handleEmailVerified
//             : handlePhoneVerified
//         }
//         onResend={
//           verificationType === "email"
//             ? handleResendEmail
//             : handleResendPhone
//         }
//       />
//     </div>
//   );
// }