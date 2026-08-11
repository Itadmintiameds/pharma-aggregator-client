"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

interface BuyerDashboardHeaderProps {
  email: string;
}

// Authenticated-buyer header: logo + current session (email) + logout.
// Kept separate from BuyerAuthHeader (signup/login pages, no session yet).
export default function BuyerDashboardHeader({ email }: BuyerDashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await buyerAuthService.logout();
    router.push("/buyer_e8d45a1b/login");
  };

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

          <div className="flex items-center gap-4">
            <span className="text-p3 font-body text-neutral-700">
              Hi, <span className="font-semibold text-primary-800">{email}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-p3 font-body font-semibold text-primary-800 border border-primary-800 rounded-lg px-4 py-2 hover:bg-primary-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
