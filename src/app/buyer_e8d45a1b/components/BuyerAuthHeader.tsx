"use client";

import Link from "next/link";
import Image from "next/image";
import PrimaryNav from "@/src/app/components/landingPage/PrimaryNav";

// Minimal header for the buyer signup/login pages — just the logo and top
// nav, without LandingHeader's search bar / Become a Buyer / Become a Seller
// / cart row, which don't make sense on a page the buyer is already on.
export default function BuyerAuthHeader() {
  return (
    <header className="w-full bg-base-white fixed top-0 left-0 z-50 border-b border-neutral-100">
      <div className="w-full h-16 px-[40px] py-[8px] flex items-center gap-4 bg-base-white">
        <div className="max-w-full w-full h-12 mx-auto flex items-center justify-between">
          <Link href="/" className="relative w-[121px] h-[56px]">
            <Image
              src="/assets/images/tiameds.logo.png"
              alt="TiaMeds"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <PrimaryNav />
        </div>
      </div>
    </header>
  );
}
