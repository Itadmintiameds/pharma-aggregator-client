"use client";

import React, { useEffect, useState } from "react";
import { useConfirmClose } from "@/src/hooks/useConfirmClose";
import ConfirmCloseDialog from "@/src/components/common/ConfirmCloseDialog";

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

  const handleClose = () => {
    setIsVisible(false);

    setTimeout(() => {
      onClose();
    }, 300);
  };

  const { isConfirmOpen, requestClose, confirmClose, cancelClose } =
    useConfirmClose(handleClose);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [requestClose]);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex justify-end
        bg-black/40
        transition-opacity duration-300
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      onClick={requestClose}
    >
      <ConfirmCloseDialog
        isOpen={isConfirmOpen}
        onConfirm={confirmClose}
        onCancel={cancelClose}
      />
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
