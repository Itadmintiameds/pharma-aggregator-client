"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaTags,
  FaShieldAlt,
  FaFileInvoice,
  FaCheckCircle,
  FaUserPlus,
  FaShoppingCart,
  FaTruck,
} from "react-icons/fa";
import BuyerAuthHeader from "../components/BuyerAuthHeader";
import BuyerDeclaration from "../components/BuyerDeclaration";
import Footer from "@/src/app/components/landingPage/Footer";
import SignupForm from "./components/SignupForm";
import SignupOtpStep from "./components/SignupOtpStep";

type SignupStep = "SIGNUP" | "OTP";

const BENEFITS = [
  {
    icon: FaSearch,
    title: "Find products fast",
    text: "Search by molecule, brand or therapeutic area across verified sellers.",
  },
  {
    icon: FaTags,
    title: "Transparent pricing",
    text: "Compare unit prices and request quotes without chasing sellers.",
  },
  {
    icon: FaShieldAlt,
    title: "Verified sellers",
    text: "Every seller is checked for licences and compliance before listing.",
  },
  {
    icon: FaFileInvoice,
    title: "Orders and returns in one place",
    text: "Track orders, quotes, returns and invoices from a single dashboard.",
  },
];

const STEPS = [
  { icon: FaUserPlus, title: "Sign up", text: "Create your account with email and phone." },
  { icon: FaShoppingCart, title: "Order or quote", text: "Browse, compare and place orders or request quotes." },
  { icon: FaTruck, title: "Receive", text: "Track shipments through to delivery." },
];

export default function BuyerSignupPage() {
  const router = useRouter();
  // The buyer must accept the declarations before the sign-up form is usable; closing the popup returns to the home page.
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [step, setStep] = useState<SignupStep>("SIGNUP");
  const [email, setEmail] = useState("");
  // Captured for signature-correctness (SignupForm's onOtpSent contract
  // passes both), even though SignupOtpStep doesn't consume it today —
  // resend currently just re-enters the signup form instead of replaying
  // the original payload (see SignupOtpStep's handleResend).
  const [, setPhone] = useState("");

  const handleOtpSent = (signedUpEmail: string, signedUpPhone: string) => {
    setEmail(signedUpEmail);
    setPhone(signedUpPhone);
    setStep("OTP");
  };

  return (
    <>
      <BuyerAuthHeader />

      {!declarationAccepted && (
        <BuyerDeclaration onAccept={() => setDeclarationAccepted(true)} onClose={() => router.push("/")} />
      )}

      <main className="bg-neutral-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ================= LEFT: why TiaMeds ================= */}
          <section className="lg:col-span-7 lg:pt-6">
            <span className="inline-block rounded-full bg-primary-50 px-3.5 py-1 text-sm font-semibold uppercase tracking-wider text-primary-800">
              For buyers
            </span>
            <h1 className="mt-4 text-[34px] font-heading font-bold leading-tight text-neutral-900 sm:text-[40px]">
              Why Pharmacies &amp; Hospitals Choose <span className="text-primary-600">TiaMeds</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">
              Join the B2B pharma marketplace built for licensed pharmacies, clinics and hospitals. Source medicines
              from verified sellers with clear pricing and a simple ordering flow.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-heading font-semibold text-neutral-900">{title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-neutral-600">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-700 to-primary-900 p-6 text-white">
              <h2 className="text-lg font-heading font-semibold">How it works</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, text }, index) => (
                  <div key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold">
                        {index + 1}. {title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-100">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-600">
              <FaCheckCircle className="text-primary-600" /> Your account is verified with a one-time password.
            </p>
          </section>

          {/* ================= RIGHT: sign-up card ================= */}
          <section className="lg:col-span-5 lg:sticky lg:top-28">
            {step === "SIGNUP" && <SignupForm onOtpSent={handleOtpSent} />}
            {step === "OTP" && <SignupOtpStep email={email} />}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
