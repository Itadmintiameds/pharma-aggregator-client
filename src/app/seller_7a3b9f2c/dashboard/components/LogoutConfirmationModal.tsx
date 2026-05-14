"use client";

import React, { useEffect } from "react";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmationModalProps) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div
        className="relative w-full max-w-110 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Confirm Logout
          </h2>

          <p className="mb-1 text-gray-600">
            You are about to leave the dashboard.
          </p>

          <p className="mb-8 text-sm text-gray-500">
            Do you want to logout of your session?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 border-2 rounded-xl bg-red-600 px-4 py-3 font-medium text-white"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;








// "use client";

// import React from "react";
// import CommonModal from "../commonComponent/CommonModal";


// interface LogoutConfirmationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
// }

// const LogoutConfirmationModal = ({
//   isOpen,
//   onClose,
//   onConfirm,
// }: LogoutConfirmationModalProps) => {
//   if (!isOpen) return null;
  
//   return (
//     <CommonModal onClose={onClose} width="w-[448px]">
//       <div className="flex flex-col items-center justify-center min-h-screen p-6">
//         <div className="text-center w-full">
//           <div className="flex justify-end mb-4">
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-500 transition-colors"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
          
//           <div className="flex justify-center mb-6">
//             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
//               <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//               </svg>
//             </div>
//           </div>
          
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">
//             Confirm Logout
//           </h3>
          
//           <p className="text-gray-600 mb-2">
//             You are about to leave the dashboard.
//           </p>
//           <p className="text-gray-500 text-sm mb-8">
//             Do you want to logout of your session?
//           </p>
          
//           <div className="flex gap-3">
//             <button
//               type="button"
//               className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
//               onClick={onClose}
//             >
//               Cancel
//             </button>
//             <button
//               type="button"
//               className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
//               onClick={onConfirm}
//             >
//               Yes, Logout
//             </button>
//           </div>
//         </div>
//       </div>
//     </CommonModal>
//   );
// };

// export default LogoutConfirmationModal;