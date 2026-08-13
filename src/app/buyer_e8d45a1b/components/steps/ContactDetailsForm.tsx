"use client";

import React, { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Briefcase, Mail } from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { toast } from "react-toastify";
import VerificationModal from "@/src/app/seller_7a3b9f2c/components/OtpModalSixBox";
import FormInput from "@/src/app/seller_7a3b9f2c/components/FormInput";
import { buyerRegistrationService } from "@/src/services/buyer/buyerRegistrationService";
import { BuyerFormData } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  errors: Record<string, string>;
  buyerTypeName?: string;
  tempBuyerId: number | null;
  onChange: (field: string, value: unknown) => void;
  onEmailVerifiedChange: (verified: boolean) => void;
  onPhoneVerifiedChange: (verified: boolean) => void;
  prevStep: () => void;
  nextStep: () => void;
}

// Step 3: Contact Details. "Full Name" carries a "Doctor's Name" hint when
// the selected buyer type is Clinic, per the spec — clinics are usually
// represented by the treating doctor rather than a generic administrator.
export default function ContactDetailsForm({
  formData,
  errors,
  buyerTypeName,
  tempBuyerId,
  onChange,
  onEmailVerifiedChange,
  onPhoneVerifiedChange,
  prevStep,
  nextStep,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExistsError, setPhoneExistsError] = useState("");
  // Separate per-field, not one shared flag — otherwise sending the mobile
  // OTP also flips the email button's label to "Sending..." (and vice
  // versa) even though nothing is happening on that field.
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);

  const isClinic = (buyerTypeName ?? "").trim().toLowerCase() === "clinic";

  const handleEmailBlur = async () => {
    if (!formData.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      setEmailExistsError("");
      return;
    }
    setIsCheckingEmail(true);
    try {
      const exists = await buyerRegistrationService.checkEmailUnique(formData.contactEmail, tempBuyerId);
      setEmailExistsError(exists ? "This email is already registered. Please use a different email address." : "");
    } catch {
      setEmailExistsError("");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handlePhoneBlur = async () => {
    const clean = (formData.contactMobile || "").replace(/\D/g, "");
    if (clean.length !== 10) {
      setPhoneExistsError("");
      return;
    }
    setIsCheckingPhone(true);
    try {
      const exists = await buyerRegistrationService.checkMobileUnique(clean, tempBuyerId);
      setPhoneExistsError(exists ? "This mobile number is already registered. Please use a different number." : "");
    } catch {
      setPhoneExistsError("");
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!formData.contactEmail || emailExistsError || isCheckingEmail || isSendingEmailOtp) return;
    setIsSendingEmailOtp(true);
    try {
      await buyerRegistrationService.sendContactOtp(formData.contactEmail, "email");
      setVerificationType("email");
      setShowModal(true);
      toast.success("Email OTP sent successfully");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to send email OTP");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Twilio's verify service requires E.164 (+<country><number>), not a bare
  // 10-digit number — mirrors the seller wizard's `${selectedCountryCode}${mobile}`
  // pattern in CoordinatorForm.tsx. No country selector exists on this form
  // yet, so this hardcodes India's code, matching the ^[0-9]{10}$-only
  // validation already enforced on TempBuyerContactDTO.mobile.
  const toE164 = (mobile: string) => `+91${mobile}`;

  const handleSendPhoneOtp = async () => {
    const clean = (formData.contactMobile || "").replace(/\D/g, "");
    if (clean.length !== 10 || phoneExistsError || isCheckingPhone || isSendingPhoneOtp) return;
    setIsSendingPhoneOtp(true);
    try {
      await buyerRegistrationService.sendContactOtp(toE164(clean), "phone");
      setVerificationType("phone");
      setShowModal(true);
      toast.success("Mobile OTP sent successfully");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to send mobile OTP");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerify = async (otp: string) => {
    const identifier =
      verificationType === "email" ? formData.contactEmail : toE164((formData.contactMobile || "").replace(/\D/g, ""));
    await buyerRegistrationService.verifyContactOtp(identifier, otp, verificationType);
  };

  const handleVerified = () => {
    setShowModal(false);
    if (verificationType === "email") {
      onEmailVerifiedChange(true);
      toast.success("Email verified successfully");
    } else {
      onPhoneVerifiedChange(true);
      toast.success("Mobile number verified successfully");
    }
  };

  const handleResend = async () => {
    const identifier =
      verificationType === "email" ? formData.contactEmail : toE164((formData.contactMobile || "").replace(/\D/g, ""));
    await buyerRegistrationService.sendContactOtp(identifier, verificationType);
    toast.success("OTP resent successfully");
  };

  const handleContinue = () => {
    if (emailExistsError || phoneExistsError) return;
    if (!formData.emailVerified || !formData.phoneVerified) {
      toast.error("Please verify both email and mobile number");
      return;
    }
    nextStep();
  };

  return (
    <div className="flex flex-col gap-5 bg-white">
      <div>
        <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Contact details
        </div>
        <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Primary point of contact for communication and verification
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
        <FormInput
          label={isClinic ? "Doctor's Name" : "Full Name"}
          required
          type="text"
          value={formData.contactName}
          onChange={(e) => onChange("contactName", e.target.value.replace(/[^A-Za-z\s]/g, ""))}
          placeholder={isClinic ? "Enter doctor's name" : "Enter full name"}
          maxLength={100}
          leftIcon={<HiOutlineUserGroup className="w-5 h-5" />}
          error={errors.name}
        />

        <FormInput
          label="Designation"
          required
          type="text"
          value={formData.contactDesignation}
          onChange={(e) => onChange("contactDesignation", e.target.value)}
          placeholder="Enter designation"
          maxLength={100}
          leftIcon={<Briefcase className="w-5 h-5" />}
          error={errors.designation}
        />

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            Email
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="flex gap-3 items-start">
            <FormInput
              containerClassName="flex-1"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => {
                onChange("contactEmail", e.target.value);
                onEmailVerifiedChange(false);
              }}
              onBlur={handleEmailBlur}
              placeholder="Enter email"
              disabled={formData.emailVerified}
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email || emailExistsError}
              hideMessage
            />
            <button
              onClick={handleSendEmailOtp}
              disabled={!formData.contactEmail || !!emailExistsError || formData.emailVerified || isSendingEmailOtp}
              className="h-11 px-4 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-60"
            >
              {formData.emailVerified ? "Verified" : isSendingEmailOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>
          {(errors.email || emailExistsError) && (
            <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.email || emailExistsError}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
            Mobile Number
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>
          <div className="flex gap-3 items-start">
            <FormInput
              containerClassName="flex-1"
              type="tel"
              value={formData.contactMobile}
              onChange={(e) => {
                onChange("contactMobile", e.target.value.replace(/\D/g, "").slice(0, 10));
                onPhoneVerifiedChange(false);
              }}
              onBlur={handlePhoneBlur}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              disabled={formData.phoneVerified}
              error={errors.mobile || phoneExistsError}
              hideMessage
            />
            <button
              onClick={handleSendPhoneOtp}
              disabled={
                (formData.contactMobile || "").length !== 10 ||
                !!phoneExistsError ||
                formData.phoneVerified ||
                isSendingPhoneOtp
              }
              className="h-11 px-4 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-60"
            >
              {formData.phoneVerified ? "Verified" : isSendingPhoneOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>
          {(errors.mobile || phoneExistsError) && (
            <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.mobile || phoneExistsError}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>

        <button
          onClick={handleContinue}
          className="h-12 px-6 border-2 border-primary-800 text-primary-800 rounded-xl flex items-center gap-2"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} />
        </button>
      </div>

      <VerificationModal
        show={showModal}
        label={verificationType === "email" ? formData.contactEmail : formData.contactMobile}
        type={verificationType}
        onClose={() => setShowModal(false)}
        onVerified={handleVerified}
        onResend={handleResend}
        onVerify={handleVerify}
        autoVerifyOnComplete={false}
      />
    </div>
  );
}
