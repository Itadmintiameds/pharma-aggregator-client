"use client";

import { useRouter } from "next/navigation";
import VerificationModal from "@/src/app/seller_7a3b9f2c/components/OtpModalSixBox";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface LoginOtpStepProps {
  username: string;
}

export default function LoginOtpStep({ username }: LoginOtpStepProps) {
  const router = useRouter();

  const handleVerify = async (otp: string) => {
    await buyerAuthService.verifyOtp({ username, otp });
  };

  const handleResend = async () => {
    // A fresh OTP requires re-checking the password, so resend re-enters login.
    router.push("/buyer_e8d45a1b/login");
  };

  const handleVerified = () => {
    router.push("/buyer_e8d45a1b");
  };

  return (
    <VerificationModal
      show={true}
      label={username}
      type="email"
      onClose={() => router.push("/buyer_e8d45a1b/login")}
      onVerified={handleVerified}
      onResend={handleResend}
      onVerify={handleVerify}
    />
  );
}
