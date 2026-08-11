/* eslint-disable react-hooks/purity */
"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowRight, X, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  email: string;
}

const COLORS = ["#E3427A", "#FFFD0A", "#7F21B3", "#4DE4F6"];

export default function SuccessModal({
  open,
  onClose,
  email,
}: Props) {
  const [showTick, setShowTick] = useState(false);
  const [flipTick, setFlipTick] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const timer1 = setTimeout(() => setShowTick(true), 400);

    const timer2 = setTimeout(() => {
      setFlipTick(true);
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [open]);

  // Stable decorative positions
  const decorativeCircles = useMemo(() => {
    return Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2;

      // OUTSIDE 120px image
      const radius = 85 + Math.random() * 30;

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });
  }, []);

  if (!open) return null;

  const goHome = () => {
    router.push("/seller_7a3b9f2c/dashboard");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      {/* Modal */}
      <div
        className="relative w-full max-w-120 min-h-[480px] overflow-hidden rounded-2xl bg-base-white px-6 py-10 shadow-lg"
        style={{
          animation:
            "modalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 text-sneutral-700"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {/* ================= ICON AREA ================= */}
        <div className="relative mb-8 mt-6 flex justify-center">
          <div className="relative flex items-center justify-center">

            {/* ================= DECORATIVE BURST ================= */}
            {flipTick &&
              decorativeCircles.map((circle, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: circle.color,

                    transform: `translate(${circle.x}px, ${circle.y}px)`,

                    animation: "burstPop 0.7s ease-out forwards",
                    animationDelay: `${i * 0.02}s`,
                    opacity: 0,
                  }}
                />
              ))}

            {/* ================= REGCONFIRM (FLIPPING) ================= */}
            <div
              className={`relative transition-all duration-700 ${
                showTick ? "opacity-100 scale-100" : "opacity-0 scale-75"
              } ${
                flipTick
                  ? "rotate-y-180"
                  : "rotate-y-0"
              }`}
              style={{
                width: "120px",
                height: "120px",
                transformStyle: "preserve-3d",
              }}
            >
              <Image
                src="/icons/RegConfirm.png"
                alt="Reg Confirm"
                fill
                className="object-contain"
              />
            </div>

            {/* ================= CHECKTICK ================= */}
            <div
              className={`absolute z-20 transition-all duration-700 ${
                flipTick
                  ? "opacity-100 rotate-y-0 scale-100"
                  : "opacity-0 -rotate-y-180 scale-75"
              }`}
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              <div
                className="relative"
                style={{
                  width: "40px",
                  height: "35px",
                }}
              >
                <Image
                  src="/icons/Checktick.png"
                  alt="Check Tick"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>



         {/* Heading */}
         <div className="mt-15 text-center">
          <div className="flex items-center justify-center gap-2">
             <h2 className="text-h4 font-bold text-primary-1000">
               Congratulations!
             </h2>
          </div>

         <p className="mt-1 text-p3 text-pneutral-800">
            Your registration details have been received successfully.
          </p>
       </div>

        {/* ================= EMAIL ================= */}
        <div className="flex items-center gap-3 border border-success-100 rounded-md bg-success-50 px-3 py-2.5 mt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-success-200">
            <Mail className="h-4 w-4 text-success-800" />
          </div>

          <div>
            <p>A confirmation email has been sent to</p>

            <p className="break-all font-bold text-primary-1000">
              {email}
            </p>
          </div>
        </div>

        {/* ================= CTA ================= */}
        <div className="mt-7 flex justify-center">
          {!flipTick ? (
            <div className="flex items-center gap-2 rounded-full bg-primary-900 px-4 py-2 text-white">
              <ArrowRight
                className="h-4 w-4"
                style={{
                  animation:
                    "slideArrow 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                }}
              />
            </div>
          ) : (
            <button
              onClick={goHome}
              className="flex items-center gap-2 rounded-full bg-primary-900 px-5 py-2 text-white"
              style={{
                animation:
                  "slideFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              Go to home
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= ANIMATIONS ================= */}
      <style>{`

      @keyframes burstPop {
  0% {
    opacity: 0;
    scale: 0;
  }

  40% {
    opacity: 1;
    scale: 1.4;
  }

  80% {
    opacity: 1;
    scale: 1;
  }

  100% {
    opacity: 0;
    scale: 0.6;
  }
}
        // @keyframes burstPop {
        //   0% {
        //     opacity: 0;
        //     transform: translate(0px, 0px) scale(0);
        //   }

        //   60% {
        //     opacity: 1;
        //     transform: scale(1.4);
        //   }

        //   100% {
        //     opacity: 1;
        //   }
        // }

        .rotate-y-0 {
          transform: rotateY(0deg);
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        .-rotate-y-180 {
          transform: rotateY(-180deg);
        }
      `}</style>
    </div>
  );
}














// old code dated 25.05.2026.................

// "use client";

// import { useEffect, useState } from "react";
// import { ArrowRight, CheckCircle } from "lucide-react";
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
// }: Props) {
//   const [showTick, setShowTick] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (!open) {
//       // setShowTick(false);
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
//         className="bg-white w-120 rounded-2xl shadow-xl p-10"
//         style={{
//           animation: "modalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
//         }}
//       >

//         {/* Tick Animation */}
//         {showTick && (
//           <div className="flex justify-center mb-6">
//             <div 
//               className="w-24 h-24 rounded-full bg-[#45B300] flex items-center justify-center"
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
//           <h2 className="text-3xl font-semibold text-black">
//             Congratulations!
//           </h2>

//           <p className="text-label-l3 mt-2 text-black">
//             You&apos;re almost ready to start trading.
//           </p>
//         </div>

//         {showTick && (
//           <p className="text-label-l3 text-neutral-500 mt-4 text-center">
//             Our compliance team is reviewing your details to maintain a secure marketplace. You&apos;ll be notified once your account is approved.
//           </p>
//         )}

//         {/* Dynamic Content */}
//         <div className="flex flex-col items-center mt-6">
//           {!showTick ? (
//             /* LOADING STATE */
//             <div className="flex items-center gap-2 px-6 py-3 rounded-full text-pneutral-50 bg-primary-900 font-medium">
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
//               className="flex items-center gap-2 px-6 py-3 rounded-full text-pneutral-50 bg-primary-900 transition font-medium"
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