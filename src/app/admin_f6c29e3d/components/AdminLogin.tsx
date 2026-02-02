"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      router.push("/admin_f6c29e3d");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F3ECF8] relative overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-5"
        style={{
          backgroundImage: "url('/assets/images/tiameds.logo.png')",
        }}
      />
      <div className="flex flex-col items-center gap-6 relative z-10">
        <Link href="/">
          <img
            src="/assets/images/tiameds.logo.png"
            alt="Company logo"
            className="w-[220px]"
          />
        </Link>
        <form
          onSubmit={handleSubmit}
          className="bg-white/30 backdrop-blur-md p-8 rounded-xl shadow-xl w-[400px] border border-white/40"
        >
          <h2 className="text-2xl font-bold text-center text-[#4B0082] mb-6">
            Admin Login
          </h2>
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}
          <div className="mb-4">
            <label className="block mb-1 font-medium text-[#171717]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#4B0082]"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-[#171717]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#4B0082]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#4B0082] text-white py-2 rounded-lg font-semibold hover:bg-[#751bb5] transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
