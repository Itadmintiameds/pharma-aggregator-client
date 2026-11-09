import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans, Work_Sans, Open_Sans } from "next/font/google";
// import "bootstrap-icons/font/bootstrap-icons.css";
import "./global.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { CartProvider } from "@/src/context/CartContext";
import BuyerLoginModalProvider from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import BuyerLoginModal from "@/src/app/buyer_e8d45a1b/components/BuyerLoginModal";
import BuyerSignupModal from "@/src/app/buyer_e8d45a1b/components/BuyerSignupModal";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Tiameds-MarketPlace",
  description: "Tiameds-MarketPlace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        // className="antialiased"
        className={`antialiased ${notoSans.variable} ${workSans.variable} ${openSans.variable}`}
      >
        <CartProvider>
          <BuyerLoginModalProvider>
            {children}
            <BuyerLoginModal />
            <BuyerSignupModal />
          </BuyerLoginModalProvider>
        </CartProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </body>
    </html>
  );
}
