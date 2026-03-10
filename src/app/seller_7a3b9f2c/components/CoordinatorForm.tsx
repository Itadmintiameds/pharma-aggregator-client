"use client";

import React, { useState } from "react";
import { Briefcase, Phone, Mail } from "lucide-react";
import VerificationModal from "./OtpModalSixBox";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { HiOutlineUserGroup } from "react-icons/hi2";

interface Props {
  formData: any;
  isCheckingEmail: boolean;
  isCheckingPhone: boolean;
  emailExistsError: string;
  phoneExistsError: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  prevStep: () => void;
  onOTPSuccess: () => void;
}

export default function CoordinatorForm({
  formData,
  isCheckingEmail,
  isCheckingPhone,
  emailExistsError,
  phoneExistsError,
  onEmailChange,
  onPhoneChange,
  onAlphabetInput,
  prevStep,
  onOTPSuccess,
}: Props) {

  const router = useRouter();

  const [showModal, setShowModal] = useState(false)
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email")
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPhoneChange(e.target.value);
  };

  const handleContinue = async () => {
    // Check mandatory fields with toast errors
    if (!formData.coordinatorName?.trim()) {
      toast.error("Coordinator name is required");
      return;
    }

    if (!formData.coordinatorDesignation?.trim()) {
      toast.error("Coordinator designation is required");
      return;
    }

    // Check if email has error or is being checked
    if (emailExistsError) {
      toast.error(emailExistsError);
      return;
    }

    if (phoneExistsError) {
      toast.error(phoneExistsError);
      return;
    }

    if (isCheckingEmail || isCheckingPhone) {
      toast.info("Please wait while we check availability");
      return;
    }

    // Validate email and phone are filled
    if (!formData.coordinatorEmail) {
      toast.error("Coordinator email is required");
      return;
    }

    if (!formData.coordinatorMobile) {
      toast.error("Coordinator mobile number is required");
      return;
    }

    if (formData.coordinatorMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      // Send email OTP
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      setVerificationType("email")
      setShowModal(true)
    } catch (err: any) {
      console.error('❌ Failed to send email OTP:', err);
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleEmailVerified = async () => {
    setIsTransitioning(true)

    const phoneWithPrefix = `+91${formData.coordinatorMobile}`
    await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix })

    // change modal content instead of closing
    setVerificationType("phone")

    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }

  const handlePhoneVerified = () => {
    setShowModal(false)
    onOTPSuccess()
  }

  const handleResendEmail = async () => {
    try {
      await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  const handleResendPhone = async () => {
    try {
      const phoneWithPrefix = `+91${formData.coordinatorMobile}`;
      await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
      toast.success("OTP resent successfully");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Section */}
      <div>
        <div className="text-h2 font-semibold">Coordinator contact details</div>
        <div className="text-label-l3 text-neutral-600 mt-1">
          Coordinator details for communication and verification
        </div>
      </div>

      {/* Coordinator Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
          {/* Coordinator Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="coordinatorName"
                value={formData.coordinatorName}
                onChange={(e) => onAlphabetInput(e, "coordinatorName")}
                placeholder="Enter coordinator name"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* Coordinator Designation */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Designation
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="coordinatorDesignation"
                value={formData.coordinatorDesignation}
                onChange={(e) => onAlphabetInput(e, "coordinatorDesignation")}
                placeholder="Enter designation"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Mobile Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="tel"
                name="coordinatorMobile"
                value={formData.coordinatorMobile}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
            {isCheckingPhone && (
              <p className="mt-1 text-xs text-[#4B0082] flex items-center">
                <span className="animate-spin mr-1">⏳</span>
                Checking phone availability...
              </p>
            )}
            {phoneExistsError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{phoneExistsError}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Coordinator Email ID
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="email"
                name="coordinatorEmail"
                value={formData.coordinatorEmail}
                onChange={handleEmailChange}
                placeholder="Enter email address"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
            {isCheckingEmail && (
              <p className="mt-1 text-xs text-[#4B0082] flex items-center">
                <span className="animate-spin mr-1">⏳</span>
                Checking email availability...
              </p>
            )}
            {emailExistsError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{emailExistsError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-10">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
          >
            Cancel
          </button>

          <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold">
            <Image
              src="/icons/savedrafticon.png"
              alt="Save Draft"
              width={18}
              height={18}
            />
            Save Draft
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={18}
              height={18}
            />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!!emailExistsError || !!phoneExistsError || isCheckingEmail || isCheckingPhone}
            className={`flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 transition ${
              emailExistsError || phoneExistsError || isCheckingEmail || isCheckingPhone
                ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                : 'border-primary-900 text-primary-900 font-semibold'
            }`}
          >
            Continue
            <Image
              src="/icons/continueicon.png"
              alt="Continue"
              width={18}
              height={18}
            />
          </button>
        </div>
      </div>

      {/* Email Verification Modal */}
      <VerificationModal
        show={showModal}
        label={
          verificationType === "email"
            ? formData.coordinatorEmail
            : formData.coordinatorMobile
        }
        type={verificationType}
        onClose={() => setShowModal(false)}
        onVerified={
          verificationType === "email"
            ? handleEmailVerified
            : handlePhoneVerified
        }
        onResend={
          verificationType === "email"
            ? handleResendEmail
            : handleResendPhone
        }
        // isTransitioning={isTransitioning}
      />
    </div>
  );
}










// "use client";

// import React, { useState } from "react";
// import { Users, Briefcase, Phone, Mail } from "lucide-react";
// import VerificationModal from "./OtpModalSixBox";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import Image from "next/image";

// interface Props {
//   formData: any;
//   isCheckingEmail: boolean;
//   isCheckingPhone: boolean;
//   emailExistsError: string;
//   phoneExistsError: string;
//   onEmailChange: (email: string) => void;
//   onPhoneChange: (phone: string) => void;
//   onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   prevStep: () => void;
//   onOTPSuccess: () => void; // This should be defined, not commented
// }

// export default function CoordinatorForm({
//   formData,
//   isCheckingEmail,
//   isCheckingPhone,
//   emailExistsError,
//   phoneExistsError,
//   onEmailChange,
//   onPhoneChange,
//   onAlphabetInput,
//   prevStep,
//   onOTPSuccess, // Change from nextStep to onOTPSuccess
// }: Props) {

//   // const [showEmailModal, setShowEmailModal] = useState(false);
//   // const [showPhoneModal, setShowPhoneModal] = useState(false);
//   const [showModal, setShowModal] = useState(false)
// const [verificationType, setVerificationType] = useState<"email" | "phone">("email")
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onEmailChange(e.target.value);
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onPhoneChange(e.target.value);
//   };

//   const handleContinue = async () => {
//     // Check if email has error or is being checked
//     if (emailExistsError) {
//       return; // Don't proceed if email already exists
//     }

//     if (phoneExistsError) {
//       return; // Don't proceed if phone already exists
//     }

//     if (isCheckingEmail || isCheckingPhone) {
//       return; // Don't proceed while checking
//     }

//     // Validate that fields are filled
//     if (!formData.coordinatorEmail) {
//       return;
//     }

//     if (!formData.coordinatorMobile || formData.coordinatorMobile.length !== 10) {
//       return;
//     }

//     try {
//       // Send email OTP
//       await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
//       setVerificationType("email")
// setShowModal(true)
//       // setShowEmailModal(true);
//     } catch (err: any) {
//       console.error('❌ Failed to send email OTP:', err);
//       // You might want to show a toast here
//     }
//   };

//   // const handleEmailVerified = () => {
//   //   // Start transition
//   //   setIsTransitioning(true);
    
//   //   // Close email modal with fade out
//   //   setTimeout(() => {
//   //     setShowEmailModal(false);
      
//   //     // Send phone OTP and show phone modal after a short delay
//   //     setTimeout(async () => {
//   //       try {
//   //         const phoneWithPrefix = `+91${formData.coordinatorMobile}`;
//   //         await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
          
//   //         // Show phone modal
//   //         setShowPhoneModal(true);
//   //         setIsTransitioning(false);
//   //       } catch (err: any) {
//   //         console.error('❌ Failed to send phone OTP:', err);
//   //         setIsTransitioning(false);
//   //       }
//   //     }, 300); // Wait for email modal to fade out
//   //   }, 200); // Start fade out
//   // };
// const handleEmailVerified = async () => {
//   setIsTransitioning(true)

//   const phoneWithPrefix = `+91${formData.coordinatorMobile}`
//   await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix })

//   // change modal content instead of closing
//   setVerificationType("phone")

//   setTimeout(() => {
//     setIsTransitioning(false)
//   }, 400)
// }

// const handlePhoneVerified = () => {
//   setShowModal(false)
//   onOTPSuccess()
// }
//   // const handlePhoneVerified = () => {
//   //   setIsTransitioning(true);
    
//   //   setTimeout(() => {
//   //     setShowPhoneModal(false);
      
//   //     setTimeout(() => {
//   //       setIsTransitioning(false);
//   //       // Call onOTPSuccess to go to next step
//   //       onOTPSuccess();
//   //     }, 300);
//   //   }, 200);
//   // };

//   const handleEmailModalClose = () => {
//     setShowEmailModal(false);
//     // Stay on coordinator form
//   };

//   const handlePhoneModalClose = () => {
//     setShowPhoneModal(false);
//     // Stay on coordinator form
//   };

//   const handleResendEmail = async () => {
//     await sellerRegService.sendEmailOtp({ email: formData.coordinatorEmail });
//   };

//   const handleResendPhone = async () => {
//     const phoneWithPrefix = `+91${formData.coordinatorMobile}`;
//     await sellerRegService.sendSMSOtp({ phone: phoneWithPrefix });
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Coordinator contact details</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Coordinator details for communication and verification
//         </div>
//       </div>

//       {/* Coordinator Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* Coordinator Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorName"
//                 value={formData.coordinatorName}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorName")}
//                 placeholder="Enter coordinator name"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Coordinator Designation */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Designation
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorDesignation"
//                 value={formData.coordinatorDesignation}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorDesignation")}
//                 placeholder="Enter designation"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Mobile Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Mobile Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="tel"
//                 name="coordinatorMobile"
//                 value={formData.coordinatorMobile}
//                 onChange={handlePhoneChange}
//                 placeholder="Enter 10-digit mobile number"
//                 maxLength={10}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//             {isCheckingPhone && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking phone availability...
//               </p>
//             )}
//             {phoneExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{phoneExistsError}</span>
//               </p>
//             )}
//           </div>

//           {/* Email */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Email ID
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="email"
//                 name="coordinatorEmail"
//                 value={formData.coordinatorEmail}
//                 onChange={handleEmailChange}
//                 placeholder="Enter email address"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//             {isCheckingEmail && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking email availability...
//               </p>
//             )}
//             {emailExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{emailExistsError}</span>
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-between mt-4 mb-10">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="border border-warning-500 text-warning-500 px-6 py-3 rounded-md hover:bg-warning-500 hover:text-black transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Back
//         </button>

//         <button
//           type="button"
//           onClick={handleContinue}
//           disabled={!!emailExistsError || !!phoneExistsError || isCheckingEmail || isCheckingPhone}
//           className={`px-8 py-3 rounded-md transition text-label-l2 font-semibold cursor-pointer ${
//             emailExistsError || phoneExistsError || isCheckingEmail || isCheckingPhone
//               ? 'bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed'
//               : 'bg-white border border-primary-900 text-primary-900 hover:bg-primary-900 hover:text-white'
//           }`}
//         >
//           Continue →
//         </button>
//       </div>

//       {/* Email Verification Modal */}

//       <VerificationModal
//   show={showModal}
//   label={
//     verificationType === "email"
//       ? formData.coordinatorEmail
//       : formData.coordinatorMobile
//   }
//   type={verificationType}
//   onClose={() => setShowModal(false)}
//   onVerified={
//     verificationType === "email"
//       ? handleEmailVerified
//       : handlePhoneVerified
//   }
//   onResend={
//     verificationType === "email"
//       ? handleResendEmail
//       : handleResendPhone
//   }
//   isTransitioning={isTransitioning}
// />
//       {/* <VerificationModal
//         show={showEmailModal}
//         label={formData.coordinatorEmail}
//         type="email"
//         onClose={handleEmailModalClose}
//         onVerified={handleEmailVerified}
//         onResend={handleResendEmail}
//         isTransitioning={isTransitioning && showEmailModal}
//       /> */}

//       {/* Phone Verification Modal */}
//       {/* <VerificationModal
//         show={showPhoneModal}
//         label={formData.coordinatorMobile}
//         type="phone"
//         onClose={handlePhoneModalClose}
//         onVerified={handlePhoneVerified}
//         onResend={handleResendPhone}
//         isTransitioning={isTransitioning && showPhoneModal}
//       /> */}
//     </div>
//   );
// }







// "use client";

// import React from "react";
// import { Users, Briefcase } from "lucide-react";
// import OtpVerification from "./OtpVerification"; // Import the old OTP component

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   isCheckingEmail: boolean;
//   isCheckingPhone: boolean;
//   emailExistsError: string;
//   phoneExistsError: string;
//   onEmailVerify: () => void;
//   onPhoneVerify: () => void;
//   onEmailChange: (email: string) => void;
//   onPhoneChange: (phone: string) => void;
//   onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function CoordinatorForm({
//   formData,
//   emailVerified,
//   phoneVerified,
//   isCheckingEmail,
//   isCheckingPhone,
//   emailExistsError,
//   phoneExistsError,
//   onEmailVerify,
//   onPhoneVerify,
//   onEmailChange,
//   onPhoneChange,
//   onAlphabetInput,
//   onChange,
//   prevStep,
//   nextStep,
// }: Props) {

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onEmailChange(e.target.value);
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onPhoneChange(e.target.value);
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Coordinator contact details</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Coordinator details and secure OTP verification
//         </div>
//       </div>

//       {/* Coordinator Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* Coordinator Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorName"
//                 value={formData.coordinatorName}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorName")}
//                 placeholder="Enter coordinator name"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Coordinator Designation */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Designation
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorDesignation"
//                 value={formData.coordinatorDesignation}
//                 onChange={(e) => onAlphabetInput(e, "coordinatorDesignation")}
//                 placeholder="Enter designation"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Email Verification - Using old OtpVerification component */}
//           <div className="col-span-1">
//             <OtpVerification
//               label="Email"
//               value={formData.coordinatorEmail}
//               onChange={onEmailChange}
//               onVerified={onEmailVerify}
//               verified={emailVerified}
//               disabled={!!emailExistsError || isCheckingEmail}
//             />
//             {isCheckingEmail && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking email...
//               </p>
//             )}
//             {emailExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{emailExistsError}</span>
//               </p>
//             )}
//           </div>

//           {/* Phone Verification - Using old OtpVerification component */}
//           <div className="col-span-1">
//             <OtpVerification
//               label="Mobile"
//               value={formData.coordinatorMobile}
//               onChange={onPhoneChange}
//               onVerified={onPhoneVerify}
//               verified={phoneVerified}
//               disabled={!!phoneExistsError || isCheckingPhone}
//             />
//             {isCheckingPhone && (
//               <p className="mt-1 text-xs text-[#4B0082] flex items-center">
//                 <span className="animate-spin mr-1">⏳</span>
//                 Checking phone...
//               </p>
//             )}
//             {phoneExistsError && (
//               <p className="mt-1 text-xs text-red-500 flex items-start">
//                 <span className="mr-1">⚠️</span>
//                 <span>{phoneExistsError}</span>
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Verification Status Summary */}
//       {(!emailVerified || !phoneVerified) && (
//         <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm flex items-center">
//           <span className="mr-2">⚠️</span>
//           Please verify both Email and Mobile OTP to proceed
//         </div>
//       )}

//       {emailVerified && phoneVerified && (
//         <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center">
//           <span className="mr-2">✓</span>
//           Both Email and Mobile verified successfully
//         </div>
//       )}

//       {/* Buttons */}
//       <div className="flex justify-between mt-4 mb-10">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="border border-warning-500 text-warning-500 px-6 py-3 rounded-md hover:bg-warning-500 hover:text-black transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Back
//         </button>

//         <button
//           type="button"
//           onClick={nextStep}
//           disabled={!emailVerified || !phoneVerified}
//           className={`px-8 py-3 rounded-md transition text-label-l2 font-semibold cursor-pointer ${
//             emailVerified && phoneVerified
//               ? 'bg-white border border-primary-900 text-primary-900 hover:bg-primary-900 hover:text-white'
//               : 'bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed'
//           }`}
//         >
//           Continue →
//         </button>
//       </div>
//     </div>
//   );
// }






// "use client";

// import React from "react";
// import { Users, Briefcase, Phone, Mail } from "lucide-react";

// interface Props {
//   formData: any;
//   handleChange: (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function CoordinatorForm({
//   formData,
//   handleChange,
//   prevStep,
//   nextStep,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Coordinator contact details</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Coordinator details and secure OTP
//         </div>
//       </div>

//       {/* Coordinator Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* Coordinator Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="coordinatorName"
//                 value={formData.coordinatorName}
//                 onChange={handleChange}
//                 placeholder="Enter your Name"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Coordinator Designation - Now an input field */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Designation
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="designation"
//                 value={formData.designation}
//                 onChange={handleChange}
//                 placeholder="Enter designation"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Mobile Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Mobile Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="tel"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 placeholder="Enter company phone"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Email */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Coordinator Email ID
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter company Email ID"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-between mt-4 mb-10">
//         <button
//           onClick={prevStep}
//           className="border border-warning-500 text-warning-500 px-6 py-3 rounded-md hover:bg-warning-500 hover:text-black transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Back
//         </button>

//         <button
//           onClick={nextStep}
//           className="bg-white border border-primary-900 text-md hover:text-white text-primary-900 px-8 py-3 rounded-md hover:bg-primary-900 transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Continue →
//         </button>
//       </div>
//     </div>
//   );
// }
