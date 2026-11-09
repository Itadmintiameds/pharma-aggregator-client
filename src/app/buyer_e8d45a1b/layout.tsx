import { Toaster } from "react-hot-toast";

// BuyerLoginModalProvider/BuyerLoginModal/BuyerSignupModal are mounted in
// the root layout (src/app/layout.tsx) so pages outside this subtree
// (landing, cart, product detail) can also open them for guest buyers.
export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Renders react-hot-toast's toast.* calls (BuyerHeader logout,
          BuyerOnboardingGate approval message, ...) — nothing else in the
          app mounts this component yet. */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </>
  );
}
