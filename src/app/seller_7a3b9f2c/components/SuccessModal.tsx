"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
// import { GoCheckCircleFill } from "react-icons/go";

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  email: string;
}

export default function SuccessModal({
  open,
  onClose,
  // applicationId,
  // email
}: Props) {
  const [showTick, setShowTick] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      // setShowTick(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowTick(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const goHome = () => {
    router.push("/");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* Modal with fade slide animation */}
      <div 
        className="bg-white w-120 rounded-2xl shadow-xl p-10"
        style={{
          animation: "modalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >

        {/* Tick Animation */}
        {showTick && (
          <div className="flex justify-center mb-6">
            <div 
              className="w-24 h-24 rounded-full bg-[#45B300] flex items-center justify-center"
              style={{
                animation: "pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              }}
            >
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
          </div>
        )}

        {/* Message */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900">
            Congratulations!
          </h2>

          <p className="text-label-l3 mt-2 text-neutral-600">
            Your application has been submitted successfully!
          </p>
        </div>

        {/* Application Details */}
        {/* {showTick && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center mb-3">
              <Clock className="text-[#4B0082] w-5 h-5 mr-3" />
              <span className="text-sm">
                Application ID: <strong className="text-neutral-900">{applicationId}</strong>
              </span>
            </div>
            <div className="flex items-center mb-3">
              <CheckCircle className="text-[#4B0082] w-5 h-5 mr-3" />
              <span className="text-sm">
                Submitted on: <strong className="text-neutral-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </strong>
              </span>
            </div>
            <div className="flex items-center">
              <Mail className="text-[#4B0082] w-5 h-5 mr-3" />
              <span className="text-sm">
                Confirmation sent to: <strong className="text-neutral-900">{email}</strong>
              </span>
            </div>
          </div>
        )} */}

        {/* Message about review process */}
        {showTick && (
          <p className="text-label-l3 text-neutral-500 mt-4 text-center">
            Our compliance team is reviewing your details. You&apos;ll be notified once your account is approved.
          </p>
        )}

        {/* Dynamic Content - Changes based on state */}
        <div className="flex flex-col items-center mt-6">
          {!showTick ? (
            /* LOADING STATE */
            <div className="flex items-center gap-2 px-6 py-3 rounded-full text-white bg-[#4B0082] font-medium">
              <div
                className="w-6 h-6"
                style={{
                  animation: "slideArrow 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                }}
              >
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>
          ) : (
            /* SUCCESS STATE */
            <button
              onClick={goHome}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white bg-[#4B0082] hover:bg-[#3a0066] transition font-medium"
              style={{
                animation: "slideFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            >
              Go to home
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes modalFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideArrow {
          0% {
            transform: translateX(0);
            opacity: 0.3;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateX(15px);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(0);
            opacity: 0.3;
          }
        }

        @keyframes pop {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideFromLeft {
          0% {
            transform: translateX(-40px);
            opacity: 0;
          }
          70% {
            transform: translateX(5px);
            opacity: 0.9;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}









// "use client";

// import { useEffect, useState } from "react";
// import { ArrowRight, CheckCircle, Clock, Mail } from "lucide-react";
// import { useRouter } from "next/navigation";

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   applicationId: string;
//   email: string;
// }

// export default function SuccessModal({
//   open,
//   onClose,
//   applicationId,
//   email
// }: Props) {
//   const [showTick, setShowTick] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (!open) {
//       setShowTick(false);
//       return;
//     }

//     const timer = setTimeout(() => {
//       setShowTick(true);
//     }, 1200);

//     return () => clearTimeout(timer);
//   }, [open]);

//   if (!open) return null;

//   const goHome = () => {
//     router.push("/");
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       {/* Modal with fade slide animation */}
//       <div 
//         className="bg-white w-[480px] rounded-2xl shadow-xl p-10"
//         style={{
//           animation: "modalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
//         }}
//       >

//         {/* Tick Animation */}
//         {showTick && (
//           <div className="flex justify-center mb-6">
//             <div 
//               className="w-[96px] h-[96px] rounded-full bg-[#45B300] flex items-center justify-center"
//               style={{
//                 animation: "pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
//               }}
//             >
//               <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
//             </div>
//           </div>
//         )}

//         {/* Message */}
//         <div className="text-center">
//           <h2 className="text-3xl font-semibold text-neutral-900">
//             Congratulations!
//           </h2>

//           <p className="text-label-l3 mt-2 text-neutral-600">
//             Your application has been submitted successfully!
//           </p>
//         </div>

//         {/* Application Details */}
//         {/* {showTick && (
//           <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
//             <div className="flex items-center mb-3">
//               <Clock className="text-[#4B0082] w-5 h-5 mr-3" />
//               <span className="text-sm">
//                 Application ID: <strong className="text-neutral-900">{applicationId}</strong>
//               </span>
//             </div>
//             <div className="flex items-center mb-3">
//               <CheckCircle className="text-[#4B0082] w-5 h-5 mr-3" />
//               <span className="text-sm">
//                 Submitted on: <strong className="text-neutral-900">
//                   {new Date().toLocaleDateString('en-IN', {
//                     day: '2-digit',
//                     month: '2-digit',
//                     year: 'numeric'
//                   })}
//                 </strong>
//               </span>
//             </div>
//             <div className="flex items-center">
//               <Mail className="text-[#4B0082] w-5 h-5 mr-3" />
//               <span className="text-sm">
//                 Confirmation sent to: <strong className="text-neutral-900">{email}</strong>
//               </span>
//             </div>
//           </div>
//         )} */}

//         {/* Message about review process */}
//         {showTick && (
//           <p className="text-label-l3 text-neutral-500 mt-4 text-center">
//             Our compliance team is reviewing your details. You&apos;ll be notified once your account is approved.
//           </p>
//         )}

//         {/* Dynamic Content - Changes based on state */}
//         <div className="flex flex-col items-center mt-6">
//           {!showTick ? (
//             /* LOADING STATE */
//             <div className="flex items-center gap-2 px-6 py-3 rounded-full text-white bg-[#4B0082] font-medium">
//               <div
//                 className="w-6 h-6"
//                 style={{
//                   animation: "slideArrow 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
//                 }}
//               >
//                 <ArrowRight className="w-6 h-6" />
//               </div>
//             </div>
//           ) : (
//             /* SUCCESS STATE */
//             <button
//               onClick={goHome}
//               className="flex items-center gap-2 px-6 py-3 rounded-full text-white bg-[#4B0082] hover:bg-[#3a0066] transition font-medium"
//               style={{
//                 animation: "slideFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
//               }}
//             >
//               Go to home
//               <ArrowRight className="w-5 h-5" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Animations */}
//       <style>{`
//         @keyframes modalFadeSlide {
//           0% {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           100% {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes slideArrow {
//           0% {
//             transform: translateX(0);
//             opacity: 0.3;
//           }
//           20% {
//             opacity: 1;
//           }
//           50% {
//             transform: translateX(15px);
//             opacity: 1;
//           }
//           80% {
//             opacity: 1;
//           }
//           100% {
//             transform: translateX(0);
//             opacity: 0.3;
//           }
//         }

//         @keyframes pop {
//           0% {
//             transform: scale(0.4);
//             opacity: 0;
//           }
//           50% {
//             transform: scale(1.1);
//             opacity: 0.9;
//           }
//           100% {
//             transform: scale(1);
//             opacity: 1;
//           }
//         }

//         @keyframes slideFromLeft {
//           0% {
//             transform: translateX(-40px);
//             opacity: 0;
//           }
//           70% {
//             transform: translateX(5px);
//             opacity: 0.9;
//           }
//           100% {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }








// "use client";

// import { useEffect, useState } from "react";
// import { ArrowRight } from "lucide-react";
// import { useRouter } from "next/navigation";

// export default function SuccessModal({
//   open,
//   onClose,
// }: {
//   open: boolean;
//   onClose: () => void;
// }) {
//   const [showTick, setShowTick] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (!open) {
//       setShowTick(false);
//       return;
//     }

//     const timer = setTimeout(() => {
//       setShowTick(true);
//     }, 1200);

//     return () => clearTimeout(timer);
//   }, [open]);

//   if (!open) return null;

//   const goHome = () => {
//     router.push("/");
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       {/* Modal with fade slide animation */}
//       <div 
//         className="bg-white w-[420px] rounded-2xl shadow-xl p-10"
//         style={{
//           animation: "modalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
//         }}
//       >

//         {/* Tick - Appears vertically above the message */}
//         {showTick && (
//           <div className="flex justify-center mb-6">
//             <div 
//               className="w-[96px] h-[96px] rounded-full bg-[#45B300] flex items-center justify-center"
//               style={{
//                 animation: "pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
//               }}
//             >
//               <svg
//                 width="44"
//                 height="44"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="white"
//                 strokeWidth="3"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <polyline points="20 6 9 17 4 12" />
//               </svg>
//             </div>
//           </div>
//         )}

//         {/* Message - Always visible */}
//         <div className="text-center">
//           <h2 className=" text-4xl font-semibold text-neutral-900">
//             Congratulations!
//           </h2>

//           <p className="text-label-l3 mt-2">
//             You&apos;re almost ready to start trading.
//           </p>

//           <p className="text-label-l3 text-neutral-500 mt-1 max-w-full mx-auto">
//             Our compliance team is reviewing your details to maintain a secure marketplace. You&apos;ll be notified once your account is approved.
//           </p>
//         </div>

//         {/* Dynamic Content - Changes based on state */}
//         <div className="flex flex-col items-center mt-8">
//           {!showTick ? (
//             /* LOADING STATE - Arrow slides smoothly from center to right */
//             <div className="flex items-center gap-2 px-6 py-3 rounded-full text-white bg-primary-900 font-medium">
//               <div
//                 className="w-6 h-6"
//                 style={{
//                   animation: "slideArrow 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
//                 }}
//               >
//                 <ArrowRight className="w-[32] h-[32]" />
//               </div>
//             </div>
//           ) : (
//             /* SUCCESS STATE - Button appears sliding from left */
//             <button
//               onClick={goHome}
//               className="flex items-center gap-2 px-6 py-3 rounded-full text-white
//               bg-primary-900
//               hover:opacity-90 transition font-medium"
//               style={{
//                 animation: "slideFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
//               }}
//             >
//               Go to home
//               <ArrowRight className="w-[32] h-[32]" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Add animations using style tag */}
//       <style>{`
//         @keyframes modalFadeSlide {
//           0% {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           100% {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes slideArrow {
//           0% {
//             transform: translateX(0);
//             opacity: 0.3;
//           }
//           20% {
//             opacity: 1;
//           }
//           50% {
//             transform: translateX(15px);
//             opacity: 1;
//           }
//           80% {
//             opacity: 1;
//           }
//           100% {
//             transform: translateX(0);
//             opacity: 0.3;
//           }
//         }

//         @keyframes pop {
//           0% {
//             transform: scale(0.4);
//             opacity: 0;
//           }
//           50% {
//             transform: scale(1.1);
//             opacity: 0.9;
//           }
//           100% {
//             transform: scale(1);
//             opacity: 1;
//           }
//         }

//         @keyframes slideFromLeft {
//           0% {
//             transform: translateX(-40px);
//             opacity: 0;
//           }
//           70% {
//             transform: translateX(5px);
//             opacity: 0.9;
//           }
//           100% {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }