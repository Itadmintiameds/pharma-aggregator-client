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
    // Land on the dashboard shell and let BuyerOnboardingGate itself decide
    // whether to bounce an already-approved buyer onward to "/" — avoids an
    // extra status call here just to make the same routing decision twice.
    router.push("/buyer_e8d45a1b/dashboard");
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
      autoVerifyOnComplete={false}
    />
  );
}
