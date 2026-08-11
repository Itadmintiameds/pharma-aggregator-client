"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { buyerLoginSchema, BuyerLoginFormValues } from "@/src/schema/buyer/authSchema";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface LoginFormProps {
  onOtpSent: (username: string) => void;
}

export default function LoginForm({ onOtpSent }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      setError("");

      const response = await buyerAuthService.login({
        username: values.username,
        password: values.password,
      });

      onOtpSent(response.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[28rem] mx-auto bg-white rounded-xl shadow-md p-8">
      <div className="mb-8 flex justify-center">
        <Image src="/assets/images/tiameds.logo.png" alt="TiaMeds" width={233} height={108} priority />
      </div>

      <h2 className="text-h5 text-center font-medium text-pneutral-900 mb-6 font-heading">Buyer Login</h2>

      {error && <p className="text-red-500 text-p3 text-center mb-4">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Registered email"
            autoComplete="off"
            className="w-full h-12 pl-4 pr-4 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 outline-none focus:outline-none focus:ring-0 focus:ring-pneutral-300"
            disabled={loading}
            {...register("username")}
          />
          {errors.username && (
            <p className="text-warning-500 text-xs mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="off"
              className="w-full h-12 pl-4 pr-12 leading-none rounded-xl border border-pneutral-300 bg-pneutral-50 text-pneutral-900 focus:outline-none focus:ring-0 focus:ring-pneutral-300"
              disabled={loading}
              {...register("password")}
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-sm text-pneutral-900 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/buyer_e8d45a1b/signup" className="text-pneutral-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
