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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div
        className="bg-white w-125.25 h-full overflow-y-auto overflow-x-hidden  shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default CommonModal;
