"use client";

import React, { useEffect, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);

    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex justify-end
        bg-black/40
        transition-opacity duration-300
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          bg-white
           w-125.25
          h-full
          overflow-y-auto
          overflow-x-hidden
          shadow-xl
          relative
          transform
          transition-transform
          duration-300
          ease-in-out
          ${isVisible ? "translate-x-0" : "translate-x-full"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default CommonModal;

// "use client";

// import React, { useEffect } from "react";

// interface CommonModalProps {
//   children: React.ReactNode;
//   onClose: () => void;
//   width?: string;
// }

// const CommonModal = ({
//   children,
//   onClose,
//   width = "w-[448px]",
// }: CommonModalProps) => {
//   useEffect(() => {
//     const handleEsc = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         onClose();
//       }
//     };

//     document.addEventListener("keydown", handleEsc);
//     return () => document.removeEventListener("keydown", handleEsc);
//   }, [onClose]);

//   return (
//     <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
//       <div
//         className="bg-white w-125.25 h-full overflow-y-auto overflow-x-hidden  shadow-xl relative"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {children}
//       </div>
//     </div>
//   );
// };

// export default CommonModal;
