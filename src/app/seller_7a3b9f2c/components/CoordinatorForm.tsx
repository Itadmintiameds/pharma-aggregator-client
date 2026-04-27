"use client";

import React, { useState, useRef, useEffect } from "react";
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
  onAlphabetInput: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => void;
  prevStep: () => void;
  nextStep: () => void;
}

// Country codes data with validation rules
const countryCodes = [
  {
    code: "+91",
    country: "India",
    flag: "🇮🇳",
    validate: (value: string) => {
      if (value.length !== 10) return "Mobile number must be exactly 10 digits";
      if (!/^[6-9]/.test(value)) return "Indian mobile number must start with 6, 7, 8, or 9";
      return null;
    }
  },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸", validate: (value: string) => null },
  { code: "+44", country: "UK", flag: "🇬🇧", validate: (value: string) => null },
  { code: "+61", country: "Australia", flag: "🇦🇺", validate: (value: string) => null },
  { code: "+971", country: "UAE", flag: "🇦🇪", validate: (value: string) => null },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", validate: (value: string) => null },
  { code: "+20", country: "Egypt", flag: "🇪🇬", validate: (value: string) => null },
];

// Email validation function
const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

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

  // Local state for name & designation to bypass parent's onAlphabetInput which strips numbers
  const [coordinatorNameLocal, setCoordinatorNameLocal] = useState<string>(formData.coordinatorName || "");
  const [coordinatorDesignationLocal, setCoordinatorDesignationLocal] = useState<string>(formData.coordinatorDesignation || "");

  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
        setIsPhoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- Coordinator Name handler ----
  // First character MUST be a letter (A-Z, a-z), after that letters/numbers/spaces allowed
  const handleCoordinatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // If empty, allow clear
    if (value === "") {
      setCoordinatorNameLocal("");
      onAlphabetInput(e, "coordinatorName");
      return;
    }

    // First character must be a letter
    if (!/^[A-Za-z]/.test(value)) {
      return;
    }

    // Allow only: letters, numbers, and spaces after first character
    const allowedCharsRegex = /^[A-Za-z][A-Za-z0-9\s]*$/;
    if (!allowedCharsRegex.test(value)) {
      return;
    }

    // Limit to 100 characters
    if (value.length > 100) return;

    // Save directly in local state — bypasses the parent stripping numbers
    setCoordinatorNameLocal(value);

    // Push to parent so formData stays in sync
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(e.target, value);
      e.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
    Object.defineProperty(e, "target", {
      writable: false,
      value: { ...e.target, value },
    });
    onAlphabetInput(e, "coordinatorName");
  };

  // ---- Coordinator Designation handler ----
  // First character MUST be a letter (A-Z, a-z), after that letters/numbers/spaces allowed
  const handleCoordinatorDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // If empty, allow clear
    if (value === "") {
      setCoordinatorDesignationLocal("");
      onAlphabetInput(e, "coordinatorDesignation");
      return;
    }

    // First character must be a letter
    if (!/^[A-Za-z]/.test(value)) {
      return;
    }

    // Allow only: letters, numbers, and spaces after first character
    const allowedCharsRegex = /^[A-Za-z][A-Za-z0-9\s]*$/;
    if (!allowedCharsRegex.test(value)) {
      return;
    }

    // Limit to 100 characters
    if (value.length > 100) return;

    // Save directly in local state — bypasses the parent stripping numbers
    setCoordinatorDesignationLocal(value);

    // Push to parent so formData stays in sync
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(e.target, value);
      e.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
    Object.defineProperty(e, "target", {
      writable: false,
      value: { ...e.target, value },
    });
    onAlphabetInput(e, "coordinatorDesignation");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onEmailChange(value);

    if (value) {
      const error = validateEmail(value);
      setEmailError(error || "");
    } else {
      setEmailError("");
    }
  };

  // Handle phone change with numeric only and validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (selectedCountryCode === "+91") {
      value = value.replace(/\D/g, '');

      if (value.length === 1 && !/^[6-9]$/.test(value)) {
        return;
      }

      if (value.length <= 10) {
        const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
        if (selectedCountry && selectedCountry.validate) {
          const error = selectedCountry.validate(value);
          setPhoneError(error || "");
        }
        onPhoneChange(value);
      }
    } else {
      value = value.replace(/\D/g, '');
      if (value.length <= 15) {
        setPhoneError("");
        onPhoneChange(value);
      }
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedCountryCode === "+91") {
      const currentValue = formData.coordinatorMobile || "";
      if (currentValue.length === 0) {
        const key = e.key;
        if (/^[0-5]$/.test(key)) {
          e.preventDefault();
        }
      }
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let cleanedText = pastedText.replace(/\D/g, '');

    if (selectedCountryCode === "+91") {
      if (cleanedText.length > 0) {
        if (!/^[6-9]/.test(cleanedText)) {
          cleanedText = '';
        } else {
          cleanedText = cleanedText.substring(0, 10);
        }
      }
    } else {
      cleanedText = cleanedText.substring(0, 15);
    }

    onPhoneChange(cleanedText);
  };

  const getMaxLength = () => {
    if (selectedCountryCode === "+91") return 10;
    return 15;
  };

  const getPlaceholder = () => {
    if (selectedCountryCode === "+91") return "Enter 10-digit mobile number (starts with 6,7,8,9)";
    return "Enter mobile number";
  };

  // ---------------- EMAIL OTP ----------------
  const handleSendEmailOTP = async () => {
    if (!formData.coordinatorEmail) {
      toast.error("Please enter email address");
      return;
    }

    const emailValidationError = validateEmail(formData.coordinatorEmail);
    if (emailValidationError) {
      toast.error(emailValidationError);
      return;
    }

    if (emailExistsError) {
      toast.error(emailExistsError);
      return;
    }

    if (isCheckingEmail) {
      toast.info("Please wait while checking email");
      return;
    }

    try {
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      setVerificationType("email");
      setShowModal(true);
      toast.success("Email OTP sent successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send email OTP");
    }
  };

  // ---------------- PHONE OTP ----------------
  const handleSendPhoneOTP = async () => {
    if (phoneVerified) {
      toast.info("Phone number is already verified");
      return;
    }

    if (!formData.coordinatorMobile) {
      toast.error("Please enter mobile number");
      return;
    }

    const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
    if (selectedCountry && selectedCountry.validate) {
      const error = selectedCountry.validate(formData.coordinatorMobile);
      if (error) {
        toast.error(error);
        return;
      }
    }

    if (phoneExistsError) {
      toast.error(phoneExistsError);
      return;
    }

    if (isCheckingPhone) {
      toast.info("Please wait while checking phone");
      return;
    }

    try {
      const fullPhone = `${selectedCountryCode}${formData.coordinatorMobile}`;
      await sellerRegService.sendSMSOtp({ phone: fullPhone });
      setVerificationType("phone");
      setShowModal(true);
      toast.success("Phone OTP sent successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send phone OTP");
    }
  };

  // ---------------- VERIFIED ----------------
  const handleEmailVerified = () => {
    setShowModal(false);
    onEmailVerified();
    toast.success("Email verified successfully");
  };

  const handlePhoneVerified = () => {
    setShowModal(false);
    onPhoneVerified();
    toast.success("Phone verified successfully");
  };

  // ---------------- RESEND ----------------
  const handleResendEmail = async () => {
    try {
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      toast.success("OTP resent successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleResendPhone = async () => {
    try {
      const fullPhone = `${selectedCountryCode}${formData.coordinatorMobile}`;
      await sellerRegService.sendSMSOtp({ phone: fullPhone });
      toast.success("OTP resent successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  // ---------------- CONTINUE ----------------
  const handleContinue = () => {
    if (!coordinatorNameLocal?.trim()) {
      toast.error("Coordinator name is required");
      return;
    }

    if (!coordinatorDesignationLocal?.trim()) {
      toast.error("Coordinator designation is required");
      return;
    }

    if (!formData.coordinatorEmail) {
      toast.error("Coordinator email is required");
      return;
    }

    const emailValidationError = validateEmail(formData.coordinatorEmail);
    if (emailValidationError) {
      toast.error(emailValidationError);
      return;
    }

    if (!formData.coordinatorMobile) {
      toast.error("Coordinator mobile number is required");
      return;
    }

    const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
    if (selectedCountry && selectedCountry.validate) {
      const error = selectedCountry.validate(formData.coordinatorMobile);
      if (error) {
        toast.error(error);
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

    if (!emailVerified || !phoneVerified) {
      toast.error("Please verify both Email and Mobile");
      return;
    }

    nextStep();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="text-h2 font-semibold">
          Coordinator contact details
        </div>
        <div className="text-label-l3 text-neutral-600 mt-1">
          Coordinator details for communication and verification
        </div>
      </div>

      {/* Form */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">

          {/* Name — must start with letter, numbers allowed after */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Name
              <span className="text-warning-500 ml-1">*</span>
            </label>

            <div className="relative">
              <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                value={coordinatorNameLocal}
                onChange={handleCoordinatorNameChange}
                placeholder="Enter coordinator name"
                maxLength={100}
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Designation — must start with letter, numbers allowed after */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Designation
              <span className="text-warning-500 ml-1">*</span>
            </label>

            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                value={coordinatorDesignationLocal}
                onChange={handleCoordinatorDesignationChange}
                placeholder="Enter designation"
                maxLength={100}
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Mobile Number
              <span className="text-warning-500 ml-1">*</span>
            </label>

            <div className="relative" ref={phoneDropdownRef}>
              <div className="flex">
                {/* Country Code Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPhoneDropdownOpen(!isPhoneDropdownOpen)}
                    className="h-12 px-2 pl-3 pr-2 rounded-l-2xl border border-r-0 border-neutral-500 bg-white flex items-center gap-1 focus:outline-none hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium">{selectedCountryCode}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {isPhoneDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsPhoneDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => {
                              setSelectedCountryCode(country.code);
                              setPhoneError("");
                              onPhoneChange("");
                              setIsPhoneDropdownOpen(false);
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
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.coordinatorMobile}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={handlePhonePaste}
                    placeholder={getPlaceholder()}
                    maxLength={getMaxLength()}
                    disabled={phoneVerified}
                    className={`w-full h-12 pl-10 pr-4 rounded-r-2xl border focus:outline-none ${
                      phoneError ? 'border-red-500' : 'border-neutral-500'
                    }`}
                  />
                </div>

                <button
                  onClick={handleSendPhoneOTP}
                  disabled={!!phoneError || !formData.coordinatorMobile || phoneVerified}
                  className={`h-12 px-4 rounded-lg text-white font-semibold ml-2 transition-colors ${
                    phoneVerified
                      ? 'bg-[#9F75FC] cursor-not-allowed'
                      : phoneError || !formData.coordinatorMobile
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#9F75FC] hover:bg-[#8B5CF6]'
                  }`}
                >
                  {phoneVerified ? "✓ Verified" : "Send OTP"}
                </button>
              </div>
            </div>

            {phoneError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{phoneError}</span>
              </p>
            )}

            {phoneExistsError && !phoneError && (
              <p className="text-xs text-red-500 mt-1">
                {phoneExistsError}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Email ID
              <span className="text-warning-500 ml-1">*</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="email"
                  value={formData.coordinatorEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter email"
                  disabled={emailVerified}
                  className={`w-full h-12 pl-10 pr-4 rounded-2xl border focus:outline-none ${
                    emailError ? 'border-red-500' : 'border-neutral-500'
                  }`}
                />
              </div>

              <button
                onClick={handleSendEmailOTP}
                disabled={!formData.coordinatorEmail || !!emailError || emailVerified}
                className={`h-12 px-4 rounded-lg text-white font-semibold transition-colors ${
                  emailVerified
                    ? 'bg-[#9F75FC] cursor-not-allowed'
                    : !formData.coordinatorEmail || !!emailError
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#9F75FC] hover:bg-[#8B5CF6]'
                }`}
              >
                {emailVerified ? "✓ Verified" : "Send OTP"}
              </button>
            </div>

            {emailError && (
              <p className="text-xs text-red-500 mt-1">
                {emailError}
              </p>
            )}

            {emailExistsError && !emailError && (
              <p className="text-xs text-red-500 mt-1">
                {emailExistsError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <button
          onClick={() => router.push("/")}
          className="h-12 px-6 border-2 border-warning-500 text-warning-500 rounded-xl font-semibold hover:bg-warning-50 transition-colors"
        >
          Cancel
        </button>

        <div className="flex gap-4">
          <button
            onClick={prevStep}
            className="h-12 px-6 border-2 border-neutral-500 text-neutral-500 rounded-xl flex items-center gap-2 hover:bg-neutral-50 transition-colors"
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
            className="h-12 px-6 border-2 border-primary-900 text-primary-900 rounded-xl flex items-center gap-2 hover:bg-primary-50 transition-colors"
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

      {/* OTP Modal */}
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