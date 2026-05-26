"use client";

import React from "react";

const CommonLoader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[107px] h-[107px]">
        {/* Background Ring */}
        <div className="absolute inset-0 rounded-full border-[10px] border-white" />

        {/* Animated Blue Arc */}
        <div className="loader-ring absolute inset-0 rounded-full" />
      </div>

      <style jsx>{`
        .loader-ring {
          border: 10px solid transparent;
          border-top: 10px solid #3b82f6;
          border-right: 10px solid #3b82f6;
          border-radius: 50%;
          animation: spin 700ms ease-out infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CommonLoader;