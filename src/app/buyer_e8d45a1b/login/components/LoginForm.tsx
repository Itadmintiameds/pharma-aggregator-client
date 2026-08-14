"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { TbMailFilled } from "react-icons/tb";
import { toast } from "react-toastify";
import { buyerLoginSchema, BuyerLoginFormValues } from "@/src/schema/buyer/authSchema";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface LoginFormProps {
  onOtpSent: (username: string, password: string) => void;
  onForgotPassword: () => void;
}

export default function LoginForm({ onOtpSent, onForgotPassword }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BuyerLoginFormValues>({
    resolver: zodResolver(buyerLoginSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: BuyerLoginFormValues) => {
    try {
      setLoading(true);

      const response = await buyerAuthService.login({
        username: values.username,
        password: values.password,
      });

      toast.success(response.message || "OTP sent to your email!");
      onOtpSent(response.username, values.password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-10 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-h5 text-center font-medium text-pneutral-900 mb-6 font-heading">Buyer Login</h2>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <TbMailFilled className="w-5 h-5" />
          </div>
          <input
            {...register("username")}
            type="text"
            placeholder="Registered email"
            autoComplete="off"
            className="w-full h-12 pl-12 pr-4 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 outline-none focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={loading}
          />
        </div>
        {errors.username && (
          <p className="text-warning-500 text-xs mt-1">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Image src="/icons/password.svg" alt="Lock" width={20} height={20} className="text-neutral-500" />
          </div>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="off"
            className="w-full h-12 pl-12 pr-12 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-warning-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] mb-6 bg-primary-800 text-pneutral-50 disabled:opacity-60"
      >
        {loading ? "Processing..." : "Login"}
        {!loading && <Image src="/icons/loginIcon.svg" alt="Login" width={20} height={20} />}
      </button>

      <p className="text-sm text-pneutral-900 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/buyer_e8d45a1b/signup" className="text-pneutral-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>

      <p className="text-sm text-center mt-2">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-pneutral-900 underline cursor-pointer"
          disabled={loading}
        >
          Forgot your password?
        </button>
      </p>
    </form>
  );
}
