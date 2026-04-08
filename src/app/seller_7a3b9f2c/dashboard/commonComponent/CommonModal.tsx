"use client";

import React, { useEffect } from "react";

interface CommonModalProps {
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}

const CommonModal = ({
  children,
  onClose,
  width = "w-[448px]",
}: CommonModalProps) => {

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    // <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">

      <div
        className={`bg-white rounded-2xl p-6 shadow-xl ${width} relative`}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 text-xl"
        >
          ✕
        </button> */}

        {children}
      </div>
    </div>
  );
};

export default CommonModal;