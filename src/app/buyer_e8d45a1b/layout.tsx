import { Toaster } from "react-hot-toast";
import BuyerLoginModalProvider from "./context/BuyerLoginModalContext";
import BuyerLoginModal from "./components/BuyerLoginModal";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuyerLoginModalProvider>
      {children}
      <BuyerLoginModal />
      {/* Renders react-hot-toast's toast.* calls (BuyerHeader logout,
          BuyerOnboardingGate approval message, ...) — nothing else in the
          app mounts this component yet. */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BuyerLoginModalProvider>
  );
}
