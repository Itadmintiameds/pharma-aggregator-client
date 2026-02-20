import React from "react";
import Header from "@/src/app/components/Header";

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen bg-[#F3ECF8]">
      <Header />
      <div className="flex flex-col items-center justify-center text-center px-4 mt-32">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Coming Soon 🚀
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl">
          We're actively working on buyer features. Stay tuned!
        </p>
      </div>
    </div>
  );
}
