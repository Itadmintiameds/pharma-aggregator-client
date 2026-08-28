"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Briefcase, Mail, Pencil } from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { toast } from "react-toastify";
import VerificationModal from "@/src/app/seller_7a3b9f2c/components/OtpModalSixBox";
import FormInput from "@/src/app/seller_7a3b9f2c/components/FormInput";
import { buyerRegistrationService } from "@/src/services/buyer/buyerRegistrationService";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
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

  // "Same as my login email" — the buyer already OTP-verified this email
  // during signup, so re-verifying it here is redundant.
  const [sameAsLoginEmail, setSameAsLoginEmail] = useState(false);
  // Seeded from localStorage for an instant first paint, then refreshed from
  // GET /buyer/authentication/me — a session that logged in before `phone`
  // was added to the login response (or before the buyer had a phone on
  // file at all) would otherwise never see it without logging out/in again.
  const [loginUser, setLoginUser] = useState(buyerAuthService.getCurrentUser());
  useEffect(() => {
    buyerAuthService.refreshCurrentUser().then((fresh) => {
      if (fresh) setLoginUser(fresh);
    });
  }, []);
  const loginEmail = loginUser?.email || loginUser?.username || "";

  // Still runs the same uniqueness check the manual "Send OTP" path uses
  // (excluding this draft's own tempBuyerId) — skipping it here would let a
  // mobile/email already claimed by a DIFFERENT stale/abandoned draft sail
  // through as "verified" and blow up as a raw duplicate-key error on save.
  const verifyAndMarkEmailVerified = async () => {
    setIsCheckingEmail(true);
    try {
      const exists = await buyerRegistrationService.checkEmailUnique(loginEmail, tempBuyerId);
      if (exists) {
        setEmailExistsError("This email is already registered. Please use a different email address.");
        onEmailVerifiedChange(false);
      } else {
        setEmailExistsError("");
        onEmailVerifiedChange(true);
      }
    } catch {
      onEmailVerifiedChange(true);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Keep the checkbox in sync when the email arrives via a source other
  // than toggling here — e.g. a saved draft loaded into formData by the
  // parent — so a contact email that already matches the login email shows
  // as checked (and already verified) instead of demanding a fresh OTP.
  useEffect(() => {
    const matchesLogin =
      !!loginEmail &&
      !!formData.contactEmail &&
      formData.contactEmail.trim().toLowerCase() === loginEmail.trim().toLowerCase();

    setSameAsLoginEmail(matchesLogin);

    if (matchesLogin && !formData.emailVerified) {
      verifyAndMarkEmailVerified();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.contactEmail, loginEmail]);

  const handleSameAsLoginToggle = (checked: boolean) => {
    setSameAsLoginEmail(checked);
    setEmailExistsError("");
    if (checked) {
      onChange("contactEmail", loginEmail);
      verifyAndMarkEmailVerified();
    } else {
      onChange("contactEmail", "");
      onEmailVerifiedChange(false);
    }
  };

  // "Same as my login mobile number" — mirrors the email checkbox above.
  // Note: unlike email, the signup phone is never actually OTP-verified on
  // the backend (BuyerUser.isPhoneVerified stays false from signup), so
  // this is a deliberate UX shortcut, not a reflection of real verification.
  const [sameAsLoginMobile, setSameAsLoginMobile] = useState(false);
  const loginMobile = (loginUser?.phone || "").replace(/\D/g, "").slice(-10);

  // Same reasoning as verifyAndMarkEmailVerified above — still checks
  // uniqueness (excluding this draft) before accepting the login mobile as
  // "verified", instead of trusting it blindly.
  const verifyAndMarkPhoneVerified = async () => {
    setIsCheckingPhone(true);
    try {
      const exists = await buyerRegistrationService.checkMobileUnique(loginMobile, tempBuyerId);
      if (exists) {
        setPhoneExistsError("This mobile number is already registered. Please use a different number.");
        onPhoneVerifiedChange(false);
      } else {
        setPhoneExistsError("");
        onPhoneVerifiedChange(true);
      }
    } catch {
      onPhoneVerifiedChange(true);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  useEffect(() => {
    const matchesLogin =
      loginMobile.length === 10 &&
      !!formData.contactMobile &&
      formData.contactMobile.replace(/\D/g, "") === loginMobile;

    setSameAsLoginMobile(matchesLogin);

    if (matchesLogin && !formData.phoneVerified) {
      verifyAndMarkPhoneVerified();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.contactMobile, loginMobile]);

  const handleSameAsLoginMobileToggle = (checked: boolean) => {
    setSameAsLoginMobile(checked);
    setPhoneExistsError("");
    if (checked) {
      onChange("contactMobile", loginMobile);
      verifyAndMarkPhoneVerified();
    } else {
      onChange("contactMobile", "");
      onPhoneVerifiedChange(false);
    }
  };

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

  // Once verified, the field is disabled so it can't be silently changed
  // without redoing OTP — this re-opens it for editing, which resets the
  // verified flag (see onChange below) so a new OTP is required.
  const handleEditEmail = () => {
    setEmailExistsError("");
    onEmailVerifiedChange(false);
  };

  const handleEditPhone = () => {
    setPhoneExistsError("");
    onPhoneVerifiedChange(false);
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
            {formData.emailVerified && !sameAsLoginEmail && (
              <button
                type="button"
                onClick={handleEditEmail}
                title="Change email"
                className="h-11 w-11 flex items-center justify-center rounded-xl border-2 border-pneutral-900 text-pneutral-900"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSendEmailOtp}
              disabled={!formData.contactEmail || !!emailExistsError || formData.emailVerified || isSendingEmailOtp}
              className="h-11 px-4 rounded-xl bg-primary-800 text-white font-semibold disabled:opacity-60"
            >
              {formData.emailVerified ? "Verified" : isSendingEmailOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>
          {loginEmail && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="same-as-login-email"
                checked={sameAsLoginEmail}
                onChange={(e) => handleSameAsLoginToggle(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-400 accent-primary-800"
              />
              <label
                htmlFor="same-as-login-email"
                className="text-p3 font-body text-pneutral-700 cursor-pointer"
              >
                Same as my login email ({loginEmail}) — no verification needed
              </label>
            </div>
          )}
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
            {formData.phoneVerified && !sameAsLoginMobile && (
              <button
                type="button"
                onClick={handleEditPhone}
                title="Change mobile number"
                className="h-11 w-11 flex items-center justify-center rounded-xl border-2 border-pneutral-900 text-pneutral-900"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
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
          {loginMobile.length === 10 && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="same-as-login-mobile"
                checked={sameAsLoginMobile}
                onChange={(e) => handleSameAsLoginMobileToggle(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-400 accent-primary-800"
              />
              <label
                htmlFor="same-as-login-mobile"
                className="text-p3 font-body text-pneutral-700 cursor-pointer"
              >
                Same as my login mobile number ({loginMobile}) — no verification needed
              </label>
            </div>
          )}
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
          className="h-12 px-6 rounded-xl bg-primary-800 text-white flex items-center gap-2 font-semibold"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} className="brightness-0 invert" />
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
