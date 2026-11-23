"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import VerificationModal from "@/src/app/seller_7a3b9f2c/components/OtpModalSixBox";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";

interface SignupOtpStepProps {
  email: string;
}

export default function SignupOtpStep({ email }: SignupOtpStepProps) {
  const router = useRouter();
  const { openLoginModal } = useBuyerLoginModal();

  const handleVerify = async (otp: string) => {
    await buyerAuthService.verifySignupOtp({ email, otp });
  };

  const handleResend = async () => {
    // Re-send requires the original signup payload (email/phone/password),
    // which this step doesn't hold — resending re-enters the signup form.
    router.push("/buyer_e8d45a1b/signup");
  };

  const handleVerified = () => {
    toast.success("Signup successful! Please login to continue.");
    openLoginModal();
  };

  return (
    <VerificationModal
      show={true}
      label={email}
      type="email"
      onClose={() => router.push("/buyer_e8d45a1b/signup")}
      onVerified={handleVerified}
      onResend={handleResend}
      onVerify={handleVerify}
    />
  );
}
